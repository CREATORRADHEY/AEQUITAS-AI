import pytest
import pandas as pd
import numpy as np
from engine import FairnessEngine

@pytest.fixture
def engine():
    return FairnessEngine()

@pytest.fixture
def bias_data():
    """Simple biased dataset: Women have 50% lower approval rate."""
    data = {
        'gender': ['Male', 'Male', 'Female', 'Female'],
        'loan_approved': [1, 1, 1, 0], # Male: 100%, Female: 50%
        'income': [50000, 60000, 45000, 40000]
    }
    return pd.DataFrame(data)

def test_calculate_disparate_impact(engine, bias_data):
    """Verify that DI math is correct (0.5/1.0 = 0.5)."""
    result = engine.calculate_disparate_impact(
        df=bias_data,
        protected_attr='gender',
        outcome_attr='loan_approved',
        privileged_group='Male',
        unprivileged_group='Female'
    )
    
    assert result['disparate_impact_ratio'] == 0.5
    assert result['statistical_parity_difference'] == -0.5
    assert result['privileged_rate'] == 1.0
    assert result['unprivileged_rate'] == 0.5

def test_data_cleaning_resilience(engine):
    """Verify that staged dataset drops NaNs in critical columns."""
    dirty_data = pd.DataFrame({
        'race': ['Black', 'White', None, 'Asian'],
        'loan_approved': [1, 0, 1, None], # Two rows with NaNs in critical columns
        'other': [1, 2, 3, 4]
    })
    
    config = {
        'protected_attr': 'race',
        'outcome_attr': 'loan_approved'
    }
    
    engine.stage_dataset(dirty_data, filename="dirty_test", config=config)
    
    # Original was 4 rows, should drop 2 rows due to NaNs in race or loan_approved
    assert len(engine.current_df) == 2
    assert engine.current_df['race'].isnull().sum() == 0
    assert engine.current_df['loan_approved'].isnull().sum() == 0

def test_auto_detect_schema(engine):
    """Verify that the engine can identify relevant columns."""
    df = pd.DataFrame({
        'race': ['W', 'B'],
        'gender': ['M', 'F'],
        'income': [1, 2],
        'loan_approved': [0, 1]
    })
    
    config = engine.auto_detect_config(df)
    
    assert config['protected_attr'] == 'race' # Should pick 'race' over others if available
    assert config['outcome_attr'] == 'loan_approved'

def test_audit_persistence(engine, bias_data):
    """Verify audits are saved to the history database."""
    engine.current_df = bias_data
    engine.metadata = {"filename": "test.csv", "config": {}}
    
    result = engine.run_full_audit(
        df=bias_data,
        model_id="test_model",
        protected_attr="gender",
        outcome_attr="loan_approved",
        privileged_group="Male"
    )
    
    history = engine.db.get_audit_history(model_id="test_model")
    assert len(history) > 0
    assert history[0]['model_id'] == "test_model"
    assert "disparate_impact_ratio" in history[0]['metrics']
