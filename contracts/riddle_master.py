# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *
import genlayer.gl.vm as glvm

class RiddleMaster(gl.Contract):
    # State variables
    scores: TreeMap[Address, u256]
    player_riddles: TreeMap[Address, str]
    player_answers: TreeMap[Address, str]

    def __init__(self):
        pass

    @gl.public.write
    def generate_riddle(self, context: str = "new") -> None:
        """
        Generates a new riddle for the caller using GenLayer's on-chain LLM.
        Context can be 'initial' or 'next'.
        """
        sender = gl.message.sender_address

        def leader_fn() -> dict:
            prompt = (
                f"You are a riddle master. Generate a clever, challenging {context} riddle. "
                "Return a JSON object with 'riddle' and 'answer' keys. "
                "The answer should be a single word or very short phrase."
            )
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return result

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, glvm.Return):
                return False
            data = leader_result.calldata
            if not isinstance(data, dict) or "riddle" not in data or "answer" not in data:
                return False
            return True

        # Run the non-deterministic call
        result = glvm.run_nondet_unsafe(leader_fn, validator_fn)
        
        self.player_riddles[sender] = result["riddle"]
        self.player_answers[sender] = str(result["answer"]).lower().strip()

    @gl.public.write
    def submit_answer(self, user_answer: str) -> bool:
        """
        Verifies the user's answer semantically using GenLayer's LLM.
        If correct, increments score and generates a new riddle.
        """
        sender = gl.message.sender_address
        
        if sender not in self.player_riddles:
            raise Exception("No active riddle found for this player. Generate one first.")

        riddle = self.player_riddles[sender]
        expected_answer = self.player_answers[sender]

        def leader_fn() -> str:
            prompt = (
                f"Riddle: {riddle}\n"
                f"Correct Answer: {expected_answer}\n"
                f"User's Answer: {user_answer}\n\n"
                "Is the user's answer semantically correct? "
                "Respond ONLY with 'CORRECT' or 'INCORRECT'."
            )
            result = gl.nondet.exec_prompt(prompt)
            return str(result).strip().upper()

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, glvm.Return):
                return False
            val = str(leader_result.calldata).strip().upper()
            return val in ["CORRECT", "INCORRECT"]

        evaluation = glvm.run_nondet_unsafe(leader_fn, validator_fn)

        if evaluation == "CORRECT":
            # Correct answer logic
            current_score = int(self.scores.get(sender, u256(0)))
            self.scores[sender] = u256(current_score + 1)
            
            # Generate next riddle automatically for better UX
            self.generate_riddle(context="next")
            return True
        
        # Incorrect answer
        return False

    @gl.public.view
    def get_current_riddle(self, player_address: str) -> str:
        """Returns the current riddle text for a player or an empty string."""
        return self.player_riddles.get(Address(player_address), "")

    @gl.public.view
    def get_score(self, player_address: str) -> int:
        """Returns the player's total score."""
        return int(self.scores.get(Address(player_address), u256(0)))

    @gl.public.view
    def get_leaderboard(self) -> str:
        """Returns a JSON string of the top scores."""
        scores_dict = {k.as_hex: int(v) for k, v in self.scores.items()}
        return json.dumps(scores_dict)

    @gl.public.view
    def has_active_riddle(self, player_address: str) -> bool:
        """Checks if the player currently has a riddle to solve."""
        return Address(player_address) in self.player_riddles
