import time
import traceback

from db.client import Database
from db.queries import Queries

from pipeline.runner import PipelineRunner
from utils.logger import init_logger


POLL_INTERVAL = 3
ERROR_BACKOFF = 5


class Worker:
    def __init__(self):
        self.db = Database()
        self.queries = Queries(self.db)

    def run(self):
        print("[WORKER] Started")

        while True:
            run = None  # for failure handling

            try:
                with self.db.transaction() as conn:
                    job = self.queries.get_next_job(conn)

                    if not job:
                        continue

                    run, software = job

                    self.queries.mark_run_started(conn, run.id)

                init_logger(run.id)
                print(f"[WORKER] Processing run {run.id}")

                runner = PipelineRunner(run.id)

                final = runner.run(
                    {
                        "name": software.name,
                        "urls": software.urls,
                    }
                )

                with self.db.transaction() as conn:
                    self.queries.save_analysis(conn, software.id, final)
                    self.queries.mark_run_done(conn, run.id)

                print(f"[WORKER] Completed run {run.id}")

            except Exception as e:
                print("[WORKER] Error:", e)
                traceback.print_exc()

                try:
                    if run:
                        with self.db.transaction() as conn:
                            self.queries.mark_run_failed(conn, run.id, str(e))
                except Exception as inner:
                    print("[WORKER] Failed to mark run failed:", inner)

                time.sleep(ERROR_BACKOFF)

            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    Worker().run()
