{{ config(materialized='view') }}

WITH source_data AS (
    SELECT
        order_id,
        customer_id,
        order_date,
        order_status,
        total_amount
    FROM {{ source('raw_data', 'orders') }}
    WHERE order_id IS NOT NULL
)

SELECT
    order_id,
    customer_id,
    order_date,
    UPPER(order_status) AS order_status,
    total_amount,
    CURRENT_TIMESTAMP() AS loaded_at
FROM source_data
