import json
from genlayer import *

class RiddleMaster(gl.Contract):
    scores: TreeMap[Address, int]
    player_riddles: TreeMap[Address, str]
    player_answers: TreeMap[Address, str]

    def __init__(self):
        # Explicitly initialize TreeMaps if necessary, 
        # though GenVM usually handles this via type annotations
        pass

    def _generate_new_riddle(self, sender: Address) -> None:
        def get_new_riddle() -> str:
            prompt = """
            Generate a fun, clever, and challenging riddle suitable for a blockchain/crypto community. 
            The riddle should be engaging and not too obvious.
            Return ONLY a JSON object with exactly two keys: 'riddle' and 'answer'.
            Do not include any other text or markdown formatting.
            """
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(result, sort_keys=True)

        # strict_eq ensures all validators agree on the exact same JSON string
        result_json = json.loads(gl.eq_principle.strict_eq(get_new_riddle))
        
        if "riddle" not in result_json or "answer" not in result_json:
            raise Exception("AI failed to generate a valid riddle format")
            
        self.player_riddles[sender] = result_json["riddle"]
        self.player_answers[sender] = result_json["answer"]

    @gl.public.write
    def generate_riddle(self) -> None:
        """Generates a new riddle for the caller, overwriting any existing one."""
        self._generate_new_riddle(gl.message.sender_address)

    @gl.public.write
    def submit_answer(self, user_answer: str) -> bool:
        """Submits an answer and evaluates it using AI. If correct, increments score and generates a new riddle."""
        sender = gl.message.sender_address
        if sender not in self.player_riddles:
            raise Exception("No riddle active. Call generate_riddle first.")

        riddle = self.player_riddles[sender]
        correct_answer = self.player_answers[sender]

        def evaluate_answer() -> str:
            prompt = f"""
            Riddle: {riddle}
            Correct Answer Idea: {correct_answer}
            User's Answer: {user_answer}

            Is the user's answer semantically correct and matching the intended answer? 
            Be fair but strict. 
            Respond ONLY with 'CORRECT' or 'INCORRECT'.
            """
            result = gl.nondet.exec_prompt(prompt)
            return result.strip().upper()

        evaluation = gl.eq_principle.strict_eq(evaluate_answer)
        
        if "CORRECT" in evaluation:
            # Increment score
            current_score = self.scores.get(sender, 0)
            self.scores[sender] = current_score + 1
            
            # Auto-generate next riddle for seamless gameplay
            self._generate_new_riddle(sender)
            return True
        else:
            return False

    @gl.public.view
    def get_current_riddle(self, player_address: str) -> str:
        """Returns the current riddle text for a player."""
        return self.player_riddles.get(Address(player_address), "No riddle generated yet.")

    @gl.public.view
    def get_score(self, player_address: str) -> int:
        """Returns the player's current score."""
        return self.scores.get(Address(player_address), 0)

    @gl.public.view
    def get_leaderboard(self) -> dict:
        """Returns a mapping of player addresses to their scores."""
        return {k.as_hex: v for k, v in self.scores.items()}

    @gl.public.view
    def has_active_riddle(self, player_address: str) -> bool:
        """Checks if a player has an un-solved riddle waiting."""
        return Address(player_address) in self.player_riddles
