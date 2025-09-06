{{ config(materialized='view') }}

WITH source_data AS (
    SELECT
        customer_id,
        customer_name,
        email,
        phone,
        created_at,
        updated_at
    FROM {{ source('raw_data', 'customers') }}
    WHERE customer_id IS NOT NULL
)

SELECT
    customer_id,
    TRIM(customer_name) AS customer_name,
    LOWER(email) AS email,
    phone,
    created_at,
    updated_at,
    CURRENT_TIMESTAMP() AS loaded_at
FROM source_data
