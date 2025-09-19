CREATE TABLE IF NOT EXISTS `statistics` (
    `statistics_id` UUID DEFAULT generateUUIDv7(),
    `name` String,
    `description` String,
    `person_id` Nullable(Int64),
    `cohort_ids` Nullable(String), -- 1111,2222,3333
    `author` UUID,
    `created_at` DateTime64 DEFAULT now(),
    `updated_at` DateTime64 DEFAULT now()
)
ORDER BY `statistics_id`;

CREATE TABLE IF NOT EXISTS `statistics_chart` (
    `chart_id` UUID,
    `statistics_id` UUID,
    `name` String,
    `description` String, -- {groups: ..., countBy: ...}
    `type` String,
    `definition` String,
    `result` String,
    `author` UUID,
    `created_at` DateTime64 DEFAULT now(),
    `updated_at` DateTime64 DEFAULT now()
)
ORDER BY (`statistics_id`, `chart_id`);

CREATE TABLE IF NOT EXISTS `feature_extraction`
(
    cohort_id   UUID,
    multiple    Int64,                      
    domain_name      LowCardinality(String),
    rank        Int64,                     
    concept_id  Int64,
    influence Float64,
    execution_time Int64,
    avg_f1_score Float64
)
ORDER BY (`cohort_id`, `multiple`,`domain_name`, `rank`);

CREATE OR REPLACE FUNCTION _to_date AS (a) -> toDate32(a);

CREATE OR REPLACE FUNCTION _get_year AS (a) -> toYear(a);

CREATE OR REPLACE FUNCTION _nullif AS (a, b) -> nullIf(a, b);

CREATE OR REPLACE FUNCTION _ifnull AS (a, b) -> ifNull(a, b);

CREATE OR REPLACE FUNCTION _to_int64 AS (a) -> toInt64(a);

CREATE OR REPLACE FUNCTION _upper_quartile AS (a) -> quantile(0.75)(a);

CREATE OR REPLACE FUNCTION _median AS (a) -> quantile(0.5)(a);

CREATE OR REPLACE FUNCTION _lower_quartile AS (a) -> quantile(0.25)(a);

CREATE OR REPLACE FUNCTION _maximum AS (a) -> least(_upper_quartile(a) + 1.5 * (_upper_quartile(a) - _lower_quartile(a)), max(a));

CREATE OR REPLACE FUNCTION _minimum AS (a) -> greatest(_lower_quartile(a) - 1.5 * (_upper_quartile(a) - _lower_quartile(a)), min(a));

/* Create first_condition_era */
CREATE TABLE IF NOT EXISTS first_condition_era AS condition_era;
CREATE MATERIALIZED VIEW first_condition_era_mv
TO first_condition_era
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_era_start_date ASC) AS ordinal
    FROM condition_era
)
WHERE ordinal = 1;
INSERT INTO first_condition_era
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_era_start_date ASC) AS ordinal
    FROM condition_era
)
WHERE ordinal = 1;

/* Create first_condition_occurrence */
CREATE TABLE IF NOT EXISTS first_condition_occurrence AS condition_occurrence;
CREATE MATERIALIZED VIEW first_condition_occurrence_mv
TO first_condition_occurrence
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_start_date ASC) AS ordinal
    FROM condition_occurrence
)
WHERE ordinal = 1;
INSERT INTO first_condition_occurrence
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY condition_start_date ASC) AS ordinal
    FROM condition_occurrence
)
WHERE ordinal = 1;

/* Create first_device_exposure */
CREATE TABLE IF NOT EXISTS first_device_exposure AS device_exposure;
CREATE MATERIALIZED VIEW first_device_exposure_mv
TO first_device_exposure
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY device_exposure_start_date ASC) AS ordinal
    FROM device_exposure
)
WHERE ordinal = 1;
INSERT INTO first_device_exposure
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY device_exposure_start_date ASC) AS ordinal
    FROM device_exposure
)
WHERE ordinal = 1;

/* Create first_dose_era */
CREATE TABLE IF NOT EXISTS first_dose_era AS dose_era;
CREATE MATERIALIZED VIEW first_dose_era_mv
TO first_dose_era
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY dose_era_start_date ASC) AS ordinal
    FROM dose_era
)
WHERE ordinal = 1;
INSERT INTO first_dose_era
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY dose_era_start_date ASC) AS ordinal
    FROM dose_era
)
WHERE ordinal = 1;

/* Create first_drug_era */
CREATE TABLE IF NOT EXISTS first_drug_era AS drug_era;
CREATE MATERIALIZED VIEW first_drug_era_mv
TO first_drug_era
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY drug_era_start_date ASC) AS ordinal
    FROM drug_era
)
WHERE ordinal = 1;
INSERT INTO first_drug_era
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY drug_era_start_date ASC) AS ordinal
    FROM drug_era
)
WHERE ordinal = 1;

/* Create first_drug_exposure */
CREATE TABLE IF NOT EXISTS first_drug_exposure AS drug_exposure;
CREATE MATERIALIZED VIEW first_drug_exposure_mv
TO first_drug_exposure
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY drug_exposure_start_date ASC) AS ordinal
    FROM drug_exposure
)
WHERE ordinal = 1;
INSERT INTO first_drug_exposure
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY drug_exposure_start_date ASC) AS ordinal
    FROM drug_exposure
)
WHERE ordinal = 1;

/* Create first_observation */
CREATE TABLE IF NOT EXISTS first_observation AS observation;
CREATE MATERIALIZED VIEW first_observation_mv
TO first_observation
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY observation_date ASC) AS ordinal
    FROM observation
)
WHERE ordinal = 1;
INSERT INTO first_observation
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY observation_date ASC) AS ordinal
    FROM observation
)
WHERE ordinal = 1;

/* Create first_observation_period */
CREATE TABLE IF NOT EXISTS first_observation_period AS observation_period;
CREATE MATERIALIZED VIEW first_observation_period_mv
TO first_observation_period
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY observation_period_start_date ASC) AS ordinal
    FROM observation_period
)
WHERE ordinal = 1;
INSERT INTO first_observation_period
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY observation_period_start_date ASC) AS ordinal
    FROM observation_period
)
WHERE ordinal = 1;

/* Create first_procedure_occurrence */
CREATE TABLE IF NOT EXISTS first_procedure_occurrence AS procedure_occurrence;
CREATE MATERIALIZED VIEW first_procedure_occurrence_mv
TO first_procedure_occurrence
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY procedure_date ASC) AS ordinal
    FROM procedure_occurrence
)
WHERE ordinal = 1;
INSERT INTO first_procedure_occurrence
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY procedure_date ASC) AS ordinal
    FROM procedure_occurrence
)
WHERE ordinal = 1;

/* Create first_specimen */
CREATE TABLE IF NOT EXISTS first_specimen AS specimen;
CREATE MATERIALIZED VIEW first_specimen_mv
TO first_specimen
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY specimen_date ASC) AS ordinal
    FROM specimen
)
WHERE ordinal = 1;
INSERT INTO first_specimen
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY specimen_date ASC) AS ordinal
    FROM specimen
)
WHERE ordinal = 1;

/* Create first_visit_occurrence */
CREATE TABLE IF NOT EXISTS first_visit_occurrence AS visit_occurrence;
CREATE MATERIALIZED VIEW first_visit_occurrence_mv
TO first_visit_occurrence
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY visit_start_date ASC) AS ordinal
    FROM visit_occurrence
)
WHERE ordinal = 1;
INSERT INTO first_visit_occurrence
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY visit_start_date ASC) AS ordinal
    FROM visit_occurrence
)
WHERE ordinal = 1;

/* Create first_measurement */
CREATE TABLE IF NOT EXISTS first_measurement AS measurement;
CREATE MATERIALIZED VIEW first_measurement_mv
TO first_measurement
AS SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY measurement_date ASC) AS ordinal
    FROM measurement
)
WHERE ordinal = 1;
INSERT INTO first_measurement
SELECT * EXCEPT ordinal
FROM
(
    SELECT
        *,
        row_number() OVER (PARTITION BY person_id ORDER BY measurement_date ASC) AS ordinal
    FROM measurement
)
WHERE ordinal = 1;

