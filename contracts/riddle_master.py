import json
from genlayer import *

class RiddleMaster(gl.Contract):
    scores: TreeMap[Address, int]
    player_riddles: TreeMap[Address, str]
    player_answers: TreeMap[Address, str]

    def __init__(self):
        pass

    def _generate_new_riddle(self, sender: Address) -> None:
        def get_new_riddle() -> str:
            prompt = "Generate a fun and challenging riddle for a blockchain community. Return a JSON with 'riddle' and 'answer' keys. The riddle should be unique."
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_json = json.loads(gl.eq_principle.strict_eq(get_new_riddle))
        self.player_riddles[sender] = result_json["riddle"]
        self.player_answers[sender] = result_json["answer"]

    @gl.public.write
    def generate_riddle(self) -> None:
        self._generate_new_riddle(gl.message.sender_address)

    @gl.public.write
    def submit_answer(self, user_answer: str) -> bool:
        sender = gl.message.sender_address
        if sender not in self.player_riddles:
            raise Exception("No riddle generated for this player. Call generate_riddle first.")

        riddle = self.player_riddles[sender]
        correct_answer = self.player_answers[sender]

        def evaluate_answer() -> str:
            prompt = f"""
            Riddle: {riddle}
            Expected Answer: {correct_answer}
            User Answer: {user_answer}

            Is the user answer semantically the same as the expected answer? 
            Respond only with 'CORRECT' or 'INCORRECT'.
            """
            result = gl.nondet.exec_prompt(prompt)
            return result.strip().upper()

        evaluation = gl.eq_principle.strict_eq(evaluate_answer)
        
        if "CORRECT" in evaluation:
            if sender not in self.scores:
                self.scores[sender] = 0
            self.scores[sender] += 1
            # Generate a new riddle for the next round
            self._generate_new_riddle(sender)
            return True
        else:
            return False

    @gl.public.view
    def get_current_riddle(self, player_address: str) -> str:
        return self.player_riddles.get(Address(player_address), "No riddle generated yet.")

    @gl.public.view
    def get_score(self, player_address: str) -> int:
        return self.scores.get(Address(player_address), 0)

    @gl.public.view
    def get_leaderboard(self) -> dict:
        return {k.as_hex: v for k, v in self.scores.items()}
