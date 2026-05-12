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

    def _set_riddle(self, player: Address, riddle: str, answer: str) -> None:
        self.player_riddles[player] = riddle
        self.player_answers[player] = str(answer).lower().strip()

    @gl.public.write
    def generate_riddle(self, context: str = "new", theme: str = "") -> None:
        """
        Generates a new riddle for the caller using GenLayer's on-chain LLM.
        """
        sender = gl.message.sender_address

        def leader_fn() -> dict:
            theme_part = f" with a theme of '{theme}'" if theme else ""
            prompt = (
                f"You are a riddle master. Generate a clever, challenging {context} riddle{theme_part}. "
                "Return a JSON object with 'riddle' and 'answer' keys. "
                "The answer should be a single word or very short phrase."
            )
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return result

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, glvm.Return):
                return False
            data = leader_result.calldata
            return isinstance(data, dict) and "riddle" in data and "answer" in data

        result = glvm.run_nondet_unsafe(leader_fn, validator_fn)
        self._set_riddle(sender, result["riddle"], result["answer"])

    @gl.public.write
    def submit_answer(self, user_answer: str) -> bool:
        """
        Verifies the user's answer and generates the next riddle in ONE atomic AI call.
        This ensures the score increases and the next step is ready simultaneously.
        """
        sender = gl.message.sender_address
        
        if sender not in self.player_riddles:
            raise Exception("No active riddle found. Generate one first.")

        riddle = self.player_riddles[sender]
        expected_answer = self.player_answers[sender]

        def leader_fn() -> dict:
            prompt = (
                f"Riddle: {riddle}\n"
                f"Correct Answer: {expected_answer}\n"
                f"User's Answer: {user_answer}\n\n"
                "Task 1: Is the user's answer semantically correct? (CORRECT/INCORRECT)\n"
                "Task 2: If CORRECT, generate a new clever riddle and its answer.\n\n"
                "Return a JSON object with:\n"
                "- 'evaluation': 'CORRECT' or 'INCORRECT'\n"
                "- 'next_riddle': (string, only if CORRECT)\n"
                "- 'next_answer': (string, only if CORRECT)"
            )
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return result

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, glvm.Return):
                return False
            data = leader_result.calldata
            if not isinstance(data, dict) or "evaluation" not in data:
                return False
            if data["evaluation"] == "CORRECT":
                return "next_riddle" in data and "next_answer" in data
            return True

        result = glvm.run_nondet_unsafe(leader_fn, validator_fn)

        if result["evaluation"] == "CORRECT":
            # 1. Update score
            current_score = int(self.scores.get(sender, u256(0)))
            self.scores[sender] = u256(current_score + 1)
            
            # 2. Set next riddle immediately
            self._set_riddle(sender, result["next_riddle"], result["next_answer"])
            return True
        
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
