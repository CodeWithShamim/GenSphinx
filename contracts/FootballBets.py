# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *
import genlayer.gl.vm as glvm

@allow_storage
class Bet:
    id: str
    game_date: str
    team1: str
    team2: str
    predicted_winner: str
    has_resolved: bool
    real_winner: str
    real_score: str
    resolution_url: str

    def __init__(self, id: str, game_date: str, team1: str, team2: str, predicted_winner: str, resolution_url: str):
        self.id = id
        self.game_date = game_date
        self.team1 = team1
        self.team2 = team2
        self.predicted_winner = predicted_winner
        self.has_resolved = False
        self.real_winner = ""
        self.real_score = ""
        self.resolution_url = resolution_url

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "game_date": self.game_date,
            "team1": self.team1,
            "team2": self.team2,
            "predicted_winner": self.predicted_winner,
            "has_resolved": self.has_resolved,
            "real_winner": self.real_winner,
            "real_score": self.real_score,
            "resolution_url": self.resolution_url
        }

class FootballBets(gl.Contract):
    # State variables
    # We store a TreeMap of Address to another TreeMap of bet_id to Bet object
    # But wait, nested TreeMaps are tricky. Let's use a simpler approach:
    # TreeMap[str, Bet] where key is sender_address + "_" + bet_id
    bets: TreeMap[str, Bet]
    points: TreeMap[Address, u256]

    def __init__(self):
        pass

    @gl.public.write
    def create_bet(self, game_date: str, team1: str, team2: str, predicted_winner: str) -> None:
        sender = gl.message.sender_address
        bet_id = f"{game_date}_{team1.lower()}_{team2.lower()}"
        storage_key = f"{sender.as_hex}_{bet_id}"
        
        resolution_url = f"https://www.bbc.com/sport/football/scores-fixtures/{game_date}"
        self.bets[storage_key] = Bet(bet_id, game_date, team1, team2, predicted_winner, resolution_url)

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        sender = gl.message.sender_address
        storage_key = f"{sender.as_hex}_{bet_id}"
        
        if storage_key not in self.bets:
            raise Exception("Bet not found")
        
        bet = self.bets[storage_key]
        if bet.has_resolved:
            return

        def leader_fn() -> dict:
            url = bet.resolution_url
            response = gl.nondet.web.get(url)
            # response.body is bytes, need to decode to string
            html_content = response.body.decode('utf-8') if response.body else ""
            
            prompt = (
                f"From the following HTML content of {url}, find the result of the football match "
                f"between {bet.team1} and {bet.team2} on {bet.game_date}. "
                "Return a JSON object with 'winner' (1, 2, or 0 for draw), 'score' (e.g., '2:1'), and 'found' (boolean). "
                "HTML Content:\n" + html_content[:10000]
            )
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return result

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, glvm.Return):
                return False
            data = leader_result.calldata
            return isinstance(data, dict) and "winner" in data and "score" in data and "found" in data

        result = glvm.run_nondet_unsafe(leader_fn, validator_fn)

        if result.get("found"):
            bet.has_resolved = True
            bet.real_winner = str(result["winner"])
            bet.real_score = result["score"]
            
            if bet.real_winner == bet.predicted_winner:
                current_points = int(self.points.get(sender, u256(0)))
                self.points[sender] = u256(current_points + 1)
            
            self.bets[storage_key] = bet

    @gl.public.view
    def get_bets(self) -> dict:
        """Returns all bets grouped by player."""
        result = {}
        for key, bet in self.bets.items():
            # key is sender_hex_bet_id
            addr_hex = key.split("_")[0]
            if addr_hex not in result:
                result[addr_hex] = {}
            result[addr_hex][bet.id] = bet.to_dict()
        return result

    @gl.public.view
    def get_points(self) -> dict:
        return {addr.as_hex: int(p) for addr, p in self.points.items()}

    @gl.public.view
    def get_player_points(self, player_address: str) -> int:
        return int(self.points.get(Address(player_address), u256(0)))
