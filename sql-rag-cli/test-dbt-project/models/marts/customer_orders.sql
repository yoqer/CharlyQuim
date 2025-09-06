{{ config(materialized='table') }}

WITH customer_data AS (
    SELECT * FROM {{ ref('stg_customers') }}
),

order_data AS (
    SELECT * FROM {{ ref('stg_orders') }}
),

customer_order_stats AS (
    SELECT
        customer_id,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_order_value,
        MIN(order_date) AS first_order_date,
        MAX(order_date) AS last_order_date
    FROM order_data
    GROUP BY customer_id
)

SELECT
    c.customer_id,
    c.customer_name,
    c.email,
    c.phone,
    COALESCE(cos.total_orders, 0) AS total_orders,
    COALESCE(cos.total_revenue, 0) AS total_revenue,
    COALESCE(cos.avg_order_value, 0) AS avg_order_value,
    cos.first_order_date,
    cos.last_order_date,
    CASE
        WHEN cos.total_orders >= 10 THEN 'VIP'
        WHEN cos.total_orders >= 5 THEN 'Regular'
        ELSE 'New'
    END AS customer_tier
FROM customer_data c
LEFT JOIN customer_order_stats cos
    ON c.customer_id = cos.customer_id
