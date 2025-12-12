# SuretyDAO Backend

The "Brain" of the SuretyDAO system. Handles Risk Scoring, Job Lifecycle, and Oracles.

## Setup

1.  **Install Python 3.11+**
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Environment Variables**:
    Update `.env` with your Supabase credentials.

4.  **Database**:
    Run `schema.sql` in your Supabase SQL Editor.

## Running the Server

Start the API server:
```bash
uvicorn app.main:app --reload
```
API will be available at: `http://localhost:8000`
Docs: `http://localhost:8000/docs`

## Running the Simulation

This script acts as a "Demo God" tool. It creates a job, starts it, and completes it, showing the Risk Score update in real-time.

1.  Ensure server is running.
2.  Run simulator:
    ```bash
    python simulator/run_simulation.py
    ```

## API Key Endpoints

*   `POST /jobs/`: Create a job.
*   `POST /jobs/{id}/complete`: The "Oracle" that verifies work and updates the Risk Score.
*   `GET /risk/worker/{address}`: The endpoint Chainlink Functions will call.
