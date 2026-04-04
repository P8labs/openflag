from typing import Optional, Tuple, Dict, Any

from psycopg import sql

from db.client import Database
from db.schema import (
    RunRow,
    SoftwareRow,
    SoftwareStatus,
    Tables,
    RunCols,
    SoftwareCols,
    AnalysisCols,
)


class Queries:
    def __init__(self, db: Database):
        self.db = db

    def save_run_stage(self, conn, run_id: str, stage_name: str, payload):
        stage_columns = {
            "stage1": RunCols.STAGE_1,
            "stage2": RunCols.STAGE_2,
            "stage3": RunCols.STAGE_3,
            "final": RunCols.FINAL,
        }

        stage_column = stage_columns.get(stage_name)
        if not stage_column:
            raise ValueError(f"Unknown stage: {stage_name}")

        with conn.cursor() as cur:
            cur.execute(
                sql.SQL("""
                    UPDATE {run_table}
                    SET {stage_column} = %s,
                        {status} = 'PROCESSING',
                        {updated_at} = NOW()
                    WHERE {id} = %s
                """).format(
                    run_table=sql.Identifier(Tables.RUN),
                    stage_column=sql.Identifier(stage_column),
                    status=sql.Identifier(RunCols.STATUS),
                    updated_at=sql.Identifier(RunCols.UPDATED_AT),
                    id=sql.Identifier(RunCols.ID),
                ),
                (payload, run_id),
            )

    def get_next_job(self, conn) -> Optional[Tuple[RunRow, SoftwareRow]]:
        with conn.cursor() as cur:
            query = sql.SQL("""
                SELECT
                    r.{r_id},
                    r.{r_software_id},
                    r.{r_status},
                    r.{r_created_at},
                    r.{r_updated_at},
                    r.{r_started_at},
                    r.{r_finished_at},

                    s.{s_id} AS s_id,
                    s.{s_name},
                    s.{s_type},
                    s.{s_slug},
                    s.{s_location},
                    s.{s_description},
                    s.{s_logo_url},
                    s.{s_urls},
                    s.{s_status} AS s_status,
                    s.{s_created_at} AS s_created_at,
                    s.{s_updated_at} AS s_updated_at

                FROM {run_table} r
                JOIN {software_table} s
                ON s.{s_id} = r.{r_software_id}

                WHERE r.{r_status} IN ('PENDING', 'FAILED')
                AND r.{r_retry_count} < 3
                ORDER BY r.{r_created_at} ASC

                FOR UPDATE SKIP LOCKED
                LIMIT 1
            """).format(
                # tables
                run_table=sql.Identifier(Tables.RUN),
                software_table=sql.Identifier(Tables.SOFTWARE),
                # run cols
                r_id=sql.Identifier(RunCols.ID),
                r_software_id=sql.Identifier(RunCols.SOFTWARE_ID),
                r_status=sql.Identifier(RunCols.STATUS),
                r_retry_count=sql.Identifier(RunCols.RETRY_COUNT),
                r_created_at=sql.Identifier(RunCols.CREATED_AT),
                r_updated_at=sql.Identifier(RunCols.UPDATED_AT),
                r_started_at=sql.Identifier(RunCols.STARTED_AT),
                r_finished_at=sql.Identifier(RunCols.FINISHED_AT),
                # software cols
                s_id=sql.Identifier(SoftwareCols.ID),
                s_name=sql.Identifier(SoftwareCols.NAME),
                s_type=sql.Identifier(SoftwareCols.TYPE),
                s_slug=sql.Identifier(SoftwareCols.SLUG),
                s_location=sql.Identifier(SoftwareCols.LOCATION),
                s_description=sql.Identifier(SoftwareCols.DESCRIPTION),
                s_logo_url=sql.Identifier(SoftwareCols.LOGO_URL),
                s_urls=sql.Identifier(SoftwareCols.URLS),
                s_status=sql.Identifier(SoftwareCols.STATUS),
                s_created_at=sql.Identifier(SoftwareCols.CREATED_AT),
                s_updated_at=sql.Identifier(SoftwareCols.UPDATED_AT),
            )

            cur.execute(query)

            row = cur.fetchone()
            if not row:
                return None

            row = row  # type: Dict[str, Any]

            run = RunRow(
                id=row["id"],
                software_id=row["software_id"],
                status=row["status"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                started_at=row["started_at"],
                finished_at=row["finished_at"],
            )

            software = SoftwareRow(
                id=row["s_id"],
                name=row["name"],
                type=row["type"],
                slug=row["slug"],
                location=row["location"],
                description=row["description"],
                logo_url=row["logo_url"],
                urls=row["urls"],
                status=row["s_status"],
                created_at=row["s_created_at"],
                updated_at=row["s_updated_at"],
            )

            return run, software

    def mark_run_started(self, conn, run_id: str):
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL("""
                    UPDATE {run_table}
                    SET {status} = 'PROCESSING',
                        {started_at} = NOW()
                    WHERE {id} = %s
                """).format(
                    run_table=sql.Identifier(Tables.RUN),
                    status=sql.Identifier(RunCols.STATUS),
                    started_at=sql.Identifier(RunCols.STARTED_AT),
                    id=sql.Identifier(RunCols.ID),
                ),
                (run_id,),
            )

    def mark_run_done(self, conn, run_id: str):
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL("""
                    UPDATE {run_table}
                    SET {status} = 'DONE',
                        {finished_at} = NOW()
                    WHERE {id} = %s
                """).format(
                    run_table=sql.Identifier(Tables.RUN),
                    status=sql.Identifier(RunCols.STATUS),
                    finished_at=sql.Identifier(RunCols.FINISHED_AT),
                    id=sql.Identifier(RunCols.ID),
                ),
                (run_id,),
            )

    def mark_run_failed(self, conn, run_id: str, error: str):
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL("""
                    UPDATE {run_table}
                    SET {status} = '{failed}',
                        {error} = %s,
                        {retry_count} = {retry_count} + 1,
                        {finished_at} = NOW()
                    WHERE {id} = %s
                """).format(
                    run_table=sql.Identifier(Tables.RUN),
                    status=sql.Identifier(RunCols.STATUS),
                    failed=sql.Identifier(SoftwareStatus.FAILED),
                    error=sql.Identifier(RunCols.ERROR),
                    retry_count=sql.Identifier(RunCols.RETRY_COUNT),
                    finished_at=sql.Identifier(RunCols.FINISHED_AT),
                    id=sql.Identifier(RunCols.ID),
                ),
                (error, run_id),
            )

    def save_analysis(self, conn, software_id: str, final):
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL("""
                    INSERT INTO {analysis_table} (
                        {software_id},
                        {quick_take},
                        {verdict},
                        {risk_score},
                        {red_flags},
                        {yellow_flags},
                        {green_flags},
                        {what_matters},
                        {data_flow},
                        {feature_policies},
                        {best_practices},
                        {bad_practices},
                        {reviewed},
                        updated_at,
                        created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, false, NOW(), NOW())

                    ON CONFLICT ({software_id})
                    DO UPDATE SET
                        {quick_take} = EXCLUDED.{quick_take},
                        {verdict} = EXCLUDED.{verdict},
                        {risk_score} = EXCLUDED.{risk_score},
                        {red_flags} = EXCLUDED.{red_flags},
                        {yellow_flags} = EXCLUDED.{yellow_flags},
                        {green_flags} = EXCLUDED.{green_flags},
                        {what_matters} = EXCLUDED.{what_matters},
                        {data_flow} = EXCLUDED.{data_flow},
                        {feature_policies} = EXCLUDED.{feature_policies},
                        {best_practices} = EXCLUDED.{best_practices},
                        {bad_practices} = EXCLUDED.{bad_practices},
                        {updated_at} = NOW()
                """).format(
                    analysis_table=sql.Identifier(Tables.ANALYSIS),
                    software_id=sql.Identifier(AnalysisCols.SOFTWARE_ID),
                    quick_take=sql.Identifier(AnalysisCols.QUICK_TAKE),
                    verdict=sql.Identifier(AnalysisCols.VERDICT),
                    risk_score=sql.Identifier(AnalysisCols.RISK_SCORE),
                    red_flags=sql.Identifier(AnalysisCols.RED_FLAGS),
                    yellow_flags=sql.Identifier(AnalysisCols.YELLOW_FLAGS),
                    green_flags=sql.Identifier(AnalysisCols.GREEN_FLAGS),
                    what_matters=sql.Identifier(AnalysisCols.WHAT_MATTERS),
                    data_flow=sql.Identifier(AnalysisCols.DATA_FLOW),
                    feature_policies=sql.Identifier(AnalysisCols.FEATURE_POLICIES),
                    best_practices=sql.Identifier(AnalysisCols.BEST_PRACTICES),
                    bad_practices=sql.Identifier(AnalysisCols.BAD_PRACTICES),
                    reviewed=sql.Identifier(AnalysisCols.REVIEWED),
                    updated_at=sql.Identifier(AnalysisCols.UPDATED_AT),
                ),
                (
                    software_id,
                    final.quick_take,
                    final.verdict,
                    final.risk_score,
                    final.flags.red,
                    final.flags.yellow,
                    final.flags.green,
                    final.what_matters,
                    final.data_flow,
                    final.feature_policies,
                    final.best_practices,
                    final.bad_practices,
                ),
            )
