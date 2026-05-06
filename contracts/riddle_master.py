# runner: python
# { "Depends": "py-genlayer:test" }
import json
from genlayer import *
import genlayer.gl.vm as glvm

class RiddleMaster(gl.Contract):
    scores: TreeMap[Address, int]
    player_riddles: TreeMap[Address, str]
    player_answers: TreeMap[Address, str]

    def __init__(self):
        self.scores = TreeMap()
        self.player_riddles = TreeMap()
        self.player_answers = TreeMap()

    def _parse_llm_json(self, raw: any) -> dict:
        """Robustly parse JSON from LLM output, handling dicts and strings with fences."""
        if isinstance(raw, dict):
            return raw
        
        s = str(raw).strip()
        # Remove markdown code fences if present
        if s.startswith("```"):
            parts = s.split("```")
            if len(parts) >= 2:
                s = parts[1]
                if s.startswith("json"):
                    s = s[4:]
        s = s.strip()
        
        # Find the first { and last }
        start = s.find("{")
        end = s.rfind("}") + 1
        if start != -1 and end > start:
            s = s[start:end]
            
        return json.loads(s)

    def _generate_new_riddle(self, sender: Address) -> None:
        def leader_fn() -> str:
            prompt = """
            Generate a fun, clever, and challenging riddle suitable for a blockchain/crypto community. 
            The riddle should be engaging and not too obvious.
            Return ONLY a JSON object with exactly two keys: 'riddle' and 'answer'.
            Do not include any other text or markdown formatting.
            """
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            # Return stable JSON string
            return json.dumps(self._parse_llm_json(result), sort_keys=True)

        def validator_fn(leader_result: any) -> bool:
            # leader_result is a glvm.Result (usually glvm.Return)
            if not isinstance(leader_result, glvm.Return):
                return False
            try:
                data = json.loads(leader_result.calldata)
                return "riddle" in data and "answer" in data and len(data["riddle"]) > 10
            except:
                return False

        # run_nondet_unsafe ensures consensus if validator returns True
        result_json_str = glvm.run_nondet_unsafe(leader_fn, validator_fn)
        result_json = json.loads(result_json_str)
            
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

        def leader_eval() -> str:
            prompt = f"""
            Riddle: {riddle}
            Correct Answer Idea: {correct_answer}
            User's Answer: {user_answer}

            Is the user's answer semantically correct and matching the intended answer? 
            Be fair but strict. 
            Respond ONLY with 'CORRECT' or 'INCORRECT'.
            """
            result = gl.nondet.exec_prompt(prompt)
            return "CORRECT" if "CORRECT" in result.upper() else "INCORRECT"

        def validator_eval(leader_result: any) -> bool:
            if not isinstance(leader_result, glvm.Return):
                return False
            # Re-run evaluation and see if it falls in the same category
            # (Adding some tolerance for AI variance)
            my_eval = leader_eval()
            return my_eval == leader_result.calldata

        evaluation = glvm.run_nondet_unsafe(leader_eval, validator_eval)
        
        if evaluation == "CORRECT":
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
