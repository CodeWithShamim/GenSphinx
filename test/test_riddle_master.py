import pytest
import json
from pathlib import Path

CONTRACT_PATH = "contracts/riddle_master.py"

def test_riddle_master_flow(direct_vm, direct_deploy):
    # Mock the LLM to return a riddle and answer
    riddle_data = {"riddle": "I have keys, but no locks. What am I?", "answer": "A piano"}
    direct_vm.mock_llm(r".*Generate a clever, challenging initial riddle.*", json.dumps(riddle_data))
    
    # Deploy contract
    contract = direct_deploy(CONTRACT_PATH)
    
    # Get the default sender address from the VM
    sender_address = direct_vm.sender
    
    # Generate riddle
    contract.generate_riddle(context="initial")
    
    # Check current riddle
    riddle = contract.get_current_riddle(sender_address)
    assert riddle == riddle_data["riddle"]
    
    # Check if has active riddle
    assert contract.has_active_riddle(sender_address) is True
    
    # Mock LLM for answer evaluation - CORRECT and generate next riddle
    next_riddle_data = {"riddle": "What has a heart that doesn't beat?", "answer": "An artichoke"}
    evaluation_result = {
        "evaluation": "CORRECT",
        "next_riddle": next_riddle_data["riddle"],
        "next_answer": next_riddle_data["answer"]
    }
    direct_vm.mock_llm(r".*User's Answer: A piano.*", json.dumps(evaluation_result))
    
    # Submit correct answer
    is_correct = contract.submit_answer("A piano")
    assert is_correct is True
    
    # Check score
    score = contract.get_score(sender_address)
    assert score == 1
    
    # Check new riddle
    new_riddle = contract.get_current_riddle(sender_address)
    assert new_riddle == next_riddle_data["riddle"]
    
    # Mock LLM for answer evaluation - INCORRECT
    incorrect_result = {"evaluation": "INCORRECT"}
    direct_vm.mock_llm(r".*User's Answer: A car.*", json.dumps(incorrect_result))
    
    # Submit incorrect answer
    is_correct = contract.submit_answer("A car")
    assert is_correct is False
    
    # Score should remain same
    score = contract.get_score(sender_address)
    assert score == 1
    
    # Leaderboard check
    leaderboard_json = contract.get_leaderboard()
    leaderboard = json.loads(leaderboard_json)
    sender_hex = "0x" + sender_address.hex()
    
    # Check if sender is in leaderboard and has score 1
    found = False
    for addr, points in leaderboard.items():
        if addr.lower() == sender_hex.lower():
            assert points == 1
            found = True
            break
    assert found, f"Sender {sender_hex} not found in leaderboard {leaderboard}"

def test_riddle_master_theme(direct_vm, direct_deploy):
    # Mock the LLM to return a themed riddle
    riddle_data = {"riddle": "I have rings but no fingers. What am I?", "answer": "Saturn"}
    direct_vm.mock_llm(r".*Generate a clever, challenging new riddle with a theme of 'space'.*", json.dumps(riddle_data))
    
    contract = direct_deploy(CONTRACT_PATH)
    sender_address = direct_vm.sender
    
    # Generate riddle with theme
    contract.generate_riddle(context="new", theme="space")
    
    # Check current riddle
    riddle = contract.get_current_riddle(sender_address)
    assert riddle == riddle_data["riddle"]
