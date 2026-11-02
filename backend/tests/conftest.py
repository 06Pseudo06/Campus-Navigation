"""
Shared pytest configuration and fixtures for the CampusWay backend test suite.
"""
import os
import pytest

# Ensure isolated unit test environment
os.environ["ENVIRONMENT"] = "test"
