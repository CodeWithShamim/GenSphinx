import json
import pytest
from gltest import get_contract_factory, get_default_account
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded
from test.football_bets_get_contract_schema_for_code import (
    test_football_bets_win_resolved,
    test_football_bets_win_unresolved,
    test_football_bets_draw_unresolved,
    test_football_bets_draw_resolved,
    test_football_bets_unsuccess_unresolved,
    test_football_bets_unsuccess_resolved,
)

CONTRACT_NAME = "FootballBets"

def deploy_contract(direct_deploy):
    contract = direct_deploy(f"contracts/{CONTRACT_NAME}.py")
    return contract

def test_football_bets_success_win(direct_vm, direct_deploy):
    # Contract Deploy
    contract = deploy_contract(direct_deploy)
    default_account = direct_vm.sender

    # Create Successful Bet
    contract.create_bet("2024-06-20", "Spain", "Italy", "1")

    # Get Bets
    get_bet_result = contract.get_bets()
    # Normalize keys (hex strings)
    sender_hex = "0x" + default_account.hex()
    
    # Mock Web and LLM for resolution
    direct_vm.mock_web(r".*bbc.com.*", {"body": "<html>Spain 1-0 Italy</html>"})
    direct_vm.mock_llm(r".*Spain and Italy.*", json.dumps({"winner": 1, "score": "1:0", "found": True}))

    # Resolve Successful Bet
    contract.resolve_bet("2024-06-20_spain_italy")

    # Get Points
    get_player_points_result = contract.get_player_points(sender_hex)
    assert get_player_points_result == 1

def test_football_bets_draw_success(direct_vm, direct_deploy):
    # Contract Deploy
    contract = deploy_contract(direct_deploy)
    default_account = direct_vm.sender
    sender_hex = "0x" + default_account.hex()

    # Create Successful Bet
    contract.create_bet("2024-06-20", "Denmark", "England", "0")

    # Mock Web and LLM
    direct_vm.mock_web(r".*bbc.com.*", {"body": "<html>Denmark 1-1 England</html>"})
    direct_vm.mock_llm(r".*Denmark and England.*", json.dumps({"winner": 0, "score": "1:1", "found": True}))

    # Resolve Successful Bet
    contract.resolve_bet("2024-06-20_denmark_england")

    # Get Player Points
    get_player_points_result = contract.get_player_points(sender_hex)
    assert get_player_points_result == 1

def test_football_bets_unsuccess(direct_vm, direct_deploy):
    # Contract Deploy
    contract = deploy_contract(direct_deploy)
    default_account = direct_vm.sender
    sender_hex = "0x" + default_account.hex()

    # Create Unsuccessful Bet
    contract.create_bet("2024-06-20", "Spain", "Italy", "2")

    # Mock Web and LLM
    direct_vm.mock_web(r".*bbc.com.*", {"body": "<html>Spain 1-0 Italy</html>"})
    direct_vm.mock_llm(r".*Spain and Italy.*", json.dumps({"winner": 1, "score": "1:0", "found": True}))

    # Resolve Bet
    contract.resolve_bet("2024-06-20_spain_italy")

    # Get Player Points
    get_player_points_result = contract.get_player_points(sender_hex)
    assert get_player_points_result == 0
