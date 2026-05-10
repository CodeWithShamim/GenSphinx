import pytest
import json
from pathlib import Path

CONTRACT_PATH = "contracts/riddle_master.py"

def test_riddle_master_flow(direct_vm, direct_deploy):
    # Mock the LLM to return a riddle and answer
    riddle_data = {"riddle": "I have keys, but no locks. What am I?", "answer": "A piano"}
    direct_vm.mock_llm(r".*Generate a fun, clever, and challenging riddle.*", json.dumps(riddle_data))
    
    # Deploy contract
    contract = direct_deploy(CONTRACT_PATH)
    
    # Generate riddle
    contract.generate_riddle()
    
    # Check current riddle
    from gltest import default_account
    riddle = contract.get_current_riddle(default_account.address)
    assert riddle == riddle_data["riddle"]
    
    # Check if has active riddle
    assert contract.has_active_riddle(default_account.address) is True
    
    # Mock LLM for answer evaluation - CORRECT
    direct_vm.mock_llm(r".*Is the user's answer semantically correct.*", "CORRECT")
    # Mock LLM for the NEXT riddle generation (since submit_answer calls _generate_new_riddle on success)
    next_riddle_data = {"riddle": "What has a heart that doesn't beat?", "answer": "An artichoke"}
    direct_vm.mock_llm(r".*Generate a fun, clever, and challenging riddle.*", json.dumps(next_riddle_data))
    
    # Submit correct answer
    is_correct = contract.submit_answer("A piano")
    assert is_correct is True
    
    # Check score
    score = contract.get_score(default_account.address)
    assert score == 1
    
    # Check new riddle
    new_riddle = contract.get_current_riddle(default_account.address)
    assert new_riddle == next_riddle_data["riddle"]
    
    # Mock LLM for answer evaluation - INCORRECT
    direct_vm.mock_llm(r".*Is the user's answer semantically correct.*", "INCORRECT")
    
    # Submit incorrect answer
    is_correct = contract.submit_answer("A car")
    assert is_correct is False
    
    # Score should remain same
    score = contract.get_score(default_account.address)
    assert score == 1
    
    # Leaderboard check
    leaderboard = contract.get_leaderboard()
    assert default_account.address.lower() in [addr.lower() for addr in leaderboard.keys()]
    assert leaderboard[default_account.address] == 1
