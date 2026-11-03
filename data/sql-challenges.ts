import type { SqlChallenge, SqlTable, SqlTopic, SqlValue } from "../lib/sql-challenge";

// Graded SQL practice for the Databases page. Each challenge's first dataset is shown to the learner
// as sample data; the others cover edge cases (NULLs, ties, empty results, duplicates).
// Verify with: node scripts/verify-sql-challenges.mjs

/** SQL written flush-left in a raw template: the leading newline is dropped. */
const sql = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

// ------------------------------------------------------------------ tables

const departments: SqlTable = { name: "departments", columns: [["id", "INTEGER PRIMARY KEY"], ["name", "TEXT NOT NULL"]] };
const employees: SqlTable = {
  name: "employees",
  columns: [
    ["id", "INTEGER PRIMARY KEY"], ["name", "TEXT NOT NULL"], ["department_id", "INTEGER REFERENCES departments(id)"],
    ["manager_id", "INTEGER REFERENCES employees(id)"], ["salary", "INTEGER NOT NULL"], ["bonus", "INTEGER"], ["hired_on", "TEXT NOT NULL"],
  ],
};
const customers: SqlTable = { name: "customers", columns: [["id", "INTEGER PRIMARY KEY"], ["name", "TEXT NOT NULL"], ["email", "TEXT NOT NULL"], ["city", "TEXT"]] };
const orderColumns = (customerId: string): SqlTable["columns"] => [
  ["id", "INTEGER PRIMARY KEY"], ["customer_id", customerId], ["status", "TEXT NOT NULL"], ["total", "REAL NOT NULL"], ["created_at", "TEXT NOT NULL"],
];
/** Orders alongside the customers table. customer_id is NULL for guest checkouts. */
const ordersWithCustomers: SqlTable = { name: "orders", columns: orderColumns("INTEGER REFERENCES customers(id)") };
/** Orders on their own. */
const orders: SqlTable = { name: "orders", columns: orderColumns("INTEGER NOT NULL") };
const signups: SqlTable = { name: "signups", columns: [["id", "INTEGER PRIMARY KEY"], ["email", "TEXT NOT NULL"], ["signed_up_at", "TEXT NOT NULL"], ["source", "TEXT"]] };
const payments: SqlTable = { name: "payments", columns: [["id", "INTEGER PRIMARY KEY"], ["paid_on", "TEXT NOT NULL"], ["amount", "REAL NOT NULL"]] };
const dailyActive: SqlTable = { name: "daily_active", columns: [["day", "TEXT PRIMARY KEY"], ["active_users", "INTEGER NOT NULL"]] };
const products: SqlTable = { name: "products", columns: [["id", "INTEGER PRIMARY KEY"], ["name", "TEXT NOT NULL"], ["category", "TEXT NOT NULL"], ["price", "REAL NOT NULL"]] };
const orderItems: SqlTable = { name: "order_items", columns: [["order_id", "INTEGER NOT NULL"], ["product_id", "INTEGER NOT NULL REFERENCES products(id)"], ["quantity", "INTEGER NOT NULL"]] };
const scores: SqlTable = { name: "scores", columns: [["player", "TEXT PRIMARY KEY"], ["points", "INTEGER"]] };
const users: SqlTable = { name: "users", columns: [["id", "INTEGER PRIMARY KEY"], ["email", "TEXT NOT NULL"], ["name", "TEXT NOT NULL"], ["created_at", "TEXT NOT NULL"]] };

// ------------------------------------------------------------------ shared sample data

const HR_DEPARTMENTS: SqlValue[][] = [[1, "Engineering"], [2, "Sales"], [3, "Support"], [4, "Legal"]];
// id, name, department_id, manager_id, salary, bonus, hired_on
const HR_EMPLOYEES: SqlValue[][] = [
  [1, "Priya Raman", 1, null, 185000, 20000, "2017-03-14"],
  [2, "Marcus Bell", 1, 1, 142000, null, "2021-06-01"],
  [3, "Lena Ortiz", 1, 1, 156000, 8000, "2022-02-10"],
  [4, "Tomas Varga", 1, 2, 145000, null, "2023-08-21"],
  [5, "Aisha Khan", 2, null, 120000, 15000, "2019-11-04"],
  [6, "Jonah Price", 2, 5, 98000, 12000, "2022-05-16"],
  [7, "Mei Chen", 2, 5, 131000, null, "2023-01-09"],
  [8, "Rafael Duarte", 3, null, 90000, null, "2020-07-27"],
  [9, "Nora Lindqvist", 3, 8, 72000, 3000, "2024-02-05"],
  [10, "Sam Okafor", null, 1, 110000, null, "2024-04-15"],
];
const SHOP_CUSTOMERS: SqlValue[][] = [
  [1, "Hana Sato", "hana@example.com", "Toronto"],
  [2, "Oliver Grant", "oliver@example.com", "Vancouver"],
  [3, "Fatima Noor", "fatima@example.com", "Toronto"],
  [4, "Diego Alvarez", "diego@example.com", null],
  [5, "Grace Kim", "grace@example.com", "Montreal"],
  [6, "Victor Amadi", "victor@example.com", "Calgary"],
];
// id, customer_id, status, total, created_at
const SHOP_ORDERS: SqlValue[][] = [
  [101, 1, "delivered", 120.5, "2024-01-05 09:15:00"],
  [102, 1, "delivered", 80, "2024-02-11 14:02:00"],
  [103, 1, "cancelled", 45, "2024-02-12 10:00:00"],
  [104, 2, "delivered", 300, "2024-01-20 18:30:00"],
  [105, 2, "refunded", 150, "2024-03-02 11:45:00"],
  [106, 3, "delivered", 60.25, "2023-12-30 08:00:00"],
  [107, 3, "delivered", 99.75, "2024-03-15 16:20:00"],
  [108, 3, "delivered", 40, "2024-03-31 23:59:59"],
  [109, 5, "pending", 75, "2024-04-01 00:00:00"],
  [110, 2, "delivered", 210, "2024-02-29 12:00:00"],
];
const FEW_CUSTOMERS: SqlValue[][] = [[1, "Ava Byrne", "ava@example.com", "Ottawa"], [2, "Kofi Mensah", "kofi@example.com", "Halifax"], [3, "Lin Wei", "lin@example.com", null]];
const SAMPLE = "Sample data";

export const SQL_CHALLENGES: SqlChallenge[] = [
  // ---------------------------------------------------------------- filtering & sorting
  {
    kind: "query",
    id: "recent-top-earners",
    title: "Top earners among recent hires",
    topic: "Filtering & sorting",
    difficulty: "Easy",
    concept: "`WHERE` filters rows before `ORDER BY` sorts them, and `LIMIT` keeps the first n rows of the sorted result. If the sort key can repeat, add a tie-breaker; otherwise which tied rows `LIMIT` keeps is arbitrary. Dates stored as ISO text (`'YYYY-MM-DD'`) compare correctly as plain strings.",
    prompt: "Return the three highest-paid employees hired on or after 2022-01-01. Output columns: `name`, `salary`, `hired_on`. Sort by salary from highest to lowest, breaking ties by name A to Z. If fewer than three people qualify, return all of them.",
    hint: "Filter with `hired_on >= '2022-01-01'`, then `ORDER BY salary DESC, name` and `LIMIT 3`.",
    tables: [employees],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { employees: HR_EMPLOYEES } },
      { name: "Equal salaries break ties by name", rows: { employees: [
        [1, "Zoe Park", 1, null, 140000, null, "2022-03-01"], [2, "Ben Ito", 1, null, 140000, null, "2023-03-01"], [3, "Ana Ruiz", 1, null, 140000, null, "2022-09-09"],
        [4, "Cal Moss", 1, null, 150000, null, "2024-01-01"], [5, "Ruth Abara", 1, null, 200000, null, "2015-01-01"],
      ] } },
      { name: "Hired exactly on 2022-01-01 counts; only two qualify", rows: { employees: [
        [1, "Dee Vance", 2, null, 90000, null, "2022-01-01"], [2, "Eli Shaw", 2, null, 95000, null, "2021-12-31"], [3, "Fay Lin", 2, null, 80000, null, "2023-05-05"],
      ] } },
      { name: "Nobody hired since 2022 (empty result)", rows: { employees: [
        [1, "Gus Hale", 1, null, 100000, null, "2019-02-02"], [2, "Ida Moreau", 1, 1, 90000, null, "2021-12-31"],
      ] } },
    ],
    starter: sql`
-- Highest-paid recent hires
SELECT name, salary, hired_on
FROM employees
ORDER BY salary DESC
LIMIT 3;
`,
    solution: sql`
SELECT name, salary, hired_on
FROM employees
WHERE hired_on >= '2022-01-01'
ORDER BY salary DESC, name
LIMIT 3;
`,
  },

  // ---------------------------------------------------------------- aggregation
  {
    kind: "query",
    id: "repeat-buyers",
    title: "Repeat buyers",
    topic: "Aggregation",
    difficulty: "Easy",
    concept: "`GROUP BY` collapses rows into one row per group, and aggregates like `COUNT` and `SUM` summarise each group. `WHERE` filters individual rows before grouping, while `HAVING` filters whole groups after the aggregates are computed. So a condition on `COUNT(*)` or `SUM(...)` belongs in `HAVING`.",
    prompt: "Find customers with at least two delivered orders. Return `customer_id`, `delivered_orders` (how many delivered orders they have) and `delivered_total` (the sum of those orders' totals, rounded to 2 decimal places). Orders with any other status don't count. Sort by `delivered_total` from highest to lowest, then by `customer_id` ascending.",
    hint: "`WHERE status = 'delivered'` keeps only delivered orders; `HAVING COUNT(*) >= 2` keeps only the groups you want.",
    tables: [orders],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { orders: SHOP_ORDERS } },
      { name: "Cancelled and refunded orders don't count", rows: { orders: [
        [1, 7, "delivered", 50, "2024-01-01 10:00:00"], [2, 7, "cancelled", 500, "2024-01-02 10:00:00"], [3, 7, "refunded", 20, "2024-01-03 10:00:00"],
        [4, 8, "delivered", 10.1, "2024-01-04 10:00:00"], [5, 8, "delivered", 20.2, "2024-01-05 10:00:00"],
      ] } },
      { name: "Equal totals break ties by customer_id", rows: { orders: [
        [1, 9, "delivered", 100, "2024-02-01 10:00:00"], [2, 9, "delivered", 50, "2024-02-02 10:00:00"], [3, 4, "delivered", 75, "2024-02-03 10:00:00"],
        [4, 4, "delivered", 75, "2024-02-04 10:00:00"], [5, 12, "delivered", 50, "2024-02-05 10:00:00"], [6, 12, "delivered", 50, "2024-02-06 10:00:00"],
        [7, 12, "delivered", 50, "2024-02-07 10:00:00"],
      ] } },
      { name: "Nobody has two delivered orders (empty result)", rows: { orders: [
        [1, 1, "delivered", 30, "2024-03-01 10:00:00"], [2, 2, "pending", 40, "2024-03-02 10:00:00"], [3, 2, "pending", 45, "2024-03-03 10:00:00"],
        [4, 1, "cancelled", 10, "2024-03-04 10:00:00"],
      ] } },
    ],
    starter: sql`
SELECT customer_id,
       COUNT(*) AS delivered_orders,
       ROUND(SUM(total), 2) AS delivered_total
FROM orders
GROUP BY customer_id
ORDER BY delivered_total DESC, customer_id;
`,
    solution: sql`
SELECT customer_id,
       COUNT(*) AS delivered_orders,
       ROUND(SUM(total), 2) AS delivered_total
FROM orders
WHERE status = 'delivered'
GROUP BY customer_id
HAVING COUNT(*) >= 2
ORDER BY delivered_total DESC, customer_id;
`,
  },

  // ---------------------------------------------------------------- joins
  {
    kind: "query",
    id: "customers-without-orders",
    title: "Customers who never ordered",
    topic: "Joins",
    difficulty: "Easy",
    concept: "A `LEFT JOIN` keeps every row from the left table and fills the right side with NULLs when nothing matches, so `WHERE right.id IS NULL` finds the rows with no match (an anti-join). `NOT EXISTS` does the same job. Beware `NOT IN (subquery)`: if the subquery returns even one NULL, `NOT IN` matches nothing.",
    prompt: "Return every customer who has never placed an order of any status. Output columns: `id`, `name`. Sort by `id`.",
    hint: "`LEFT JOIN` orders and keep the rows where the order side is NULL. Test it on the guest-checkout dataset, where some orders have no `customer_id`.",
    tables: [customers, ordersWithCustomers],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { customers: SHOP_CUSTOMERS, orders: SHOP_ORDERS } },
      { name: "Guest orders with a NULL customer_id", rows: { customers: FEW_CUSTOMERS, orders: [
        [1, 1, "delivered", 20, "2024-01-01 10:00:00"], [2, null, "delivered", 35, "2024-01-02 10:00:00"], [3, null, "cancelled", 12, "2024-01-03 10:00:00"],
      ] } },
      { name: "Every customer has ordered (empty result)", rows: { customers: FEW_CUSTOMERS.slice(0, 2), orders: [
        [1, 1, "cancelled", 20, "2024-01-01 10:00:00"], [2, 2, "pending", 35, "2024-01-02 10:00:00"], [3, 2, "delivered", 12, "2024-01-03 10:00:00"],
      ] } },
      { name: "No orders yet", rows: { customers: FEW_CUSTOMERS, orders: [] } },
    ],
    starter: sql`
SELECT c.id, c.name
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
ORDER BY c.id;
`,
    solution: sql`
SELECT c.id, c.name
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.id;
`,
  },
  {
    kind: "query",
    id: "orders-per-customer-2024",
    title: "Order counts that keep the zeros",
    topic: "Joins",
    difficulty: "Medium",
    concept: "With a `LEFT JOIN`, a condition on the right table in `WHERE` throws away the NULL-filled rows, which silently turns it into an inner join. Put right-table filters in the `ON` clause instead. Then count a right-table column, such as `COUNT(o.id)`: `COUNT(*)` counts the NULL-filled row as 1.",
    prompt: "List every customer with the number of orders (any status) they placed during calendar year 2024. Customers with no 2024 orders must still appear, with 0. Output columns: `customer_id`, `name`, `orders_2024`. Sort by `orders_2024` from highest to lowest, then by `customer_id` ascending.",
    hint: "`created_at` holds timestamps like `'2024-12-31 23:59:59'`, so `BETWEEN '2024-01-01' AND '2024-12-31'` misses most of New Year's Eve. Use `>= '2024-01-01' AND < '2025-01-01'`.",
    tables: [customers, ordersWithCustomers],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { customers: SHOP_CUSTOMERS, orders: SHOP_ORDERS } },
      { name: "Orders outside 2024 don't count", rows: { customers: FEW_CUSTOMERS.slice(0, 2), orders: [
        [1, 1, "delivered", 20, "2023-06-01 10:00:00"], [2, 1, "delivered", 25, "2025-01-15 09:00:00"], [3, 2, "pending", 30, "2024-07-07 07:07:07"],
      ] } },
      { name: "New Year's Eve and New Year's Day timestamps", rows: { customers: FEW_CUSTOMERS, orders: [
        [1, 1, "delivered", 10, "2023-12-31 23:59:59"], [2, 1, "delivered", 10, "2024-01-01 00:00:00"], [3, 2, "cancelled", 10, "2024-12-31 23:59:59"],
        [4, 2, "delivered", 10, "2024-12-31 08:00:00"], [5, 3, "delivered", 10, "2025-01-01 00:00:00"],
      ] } },
      { name: "No orders at all", rows: { customers: FEW_CUSTOMERS, orders: [] } },
    ],
    starter: sql`
SELECT c.id AS customer_id, c.name, COUNT(*) AS orders_2024
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.created_at >= '2024-01-01'
GROUP BY c.id, c.name
ORDER BY orders_2024 DESC, c.id;
`,
    solution: sql`
SELECT c.id AS customer_id, c.name, COUNT(o.id) AS orders_2024
FROM customers AS c
LEFT JOIN orders AS o
  ON o.customer_id = c.id
 AND o.created_at >= '2024-01-01'
 AND o.created_at < '2025-01-01'
GROUP BY c.id, c.name
ORDER BY orders_2024 DESC, c.id;
`,
  },

  // ---------------------------------------------------------------- self-joins
  {
    kind: "query",
    id: "out-earning-manager",
    title: "Paid more than the boss",
    topic: "Self-joins",
    difficulty: "Medium",
    concept: "A self-join joins a table to itself under two aliases, so one row can be compared with a related row of the same table, such as an employee and their manager. An inner join on `e.manager_id = m.id` pairs each employee with their direct manager and drops employees who have no manager.",
    prompt: "Find employees who earn strictly more than their direct manager. Output columns: `employee`, `employee_salary`, `manager`, `manager_salary`. Sort by the employee's name, then by the employee's id.",
    hint: "`FROM employees AS e JOIN employees AS m ON m.id = e.manager_id`, then compare `e.salary` with `m.salary`.",
    tables: [employees],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { employees: HR_EMPLOYEES } },
      { name: "Equal pay is not more", rows: { employees: [
        [1, "Ivy Nakamura", 1, null, 100000, null, "2020-01-01"], [2, "Jack Reyes", 1, 1, 100000, null, "2021-01-01"], [3, "Kai Moreno", 1, 1, 100001, null, "2022-01-01"],
      ] } },
      { name: "Only the direct manager counts", rows: { employees: [
        [1, "Uma Ross", 1, null, 300000, null, "2015-01-01"], [2, "Vik Patel", 1, 1, 150000, null, "2016-01-01"],
        [3, "Wes Clarke", 1, 2, 160000, null, "2018-01-01"], [4, "Xia Long", 1, 3, 155000, null, "2020-01-01"],
      ] } },
      { name: "Nobody out-earns their manager (empty result)", rows: { employees: [
        [1, "Yara Haddad", 1, null, 200000, null, "2014-01-01"], [2, "Zane Fox", 1, 1, 120000, null, "2019-01-01"], [3, "Abe Lund", null, null, 500000, null, "2010-01-01"],
      ] } },
    ],
    starter: sql`
-- e is the employee. Join a second copy of employees as the manager.
SELECT e.name AS employee, e.salary AS employee_salary
FROM employees AS e
ORDER BY e.name, e.id;
`,
    solution: sql`
SELECT e.name AS employee, e.salary AS employee_salary,
       m.name AS manager, m.salary AS manager_salary
FROM employees AS e
JOIN employees AS m ON m.id = e.manager_id
WHERE e.salary > m.salary
ORDER BY e.name, e.id;
`,
  },

  // ---------------------------------------------------------------- subqueries
  {
    kind: "query",
    id: "big-spenders-no-refunds",
    title: "Big orders, no refunds",
    topic: "Subqueries",
    difficulty: "Medium",
    concept: "`EXISTS (subquery)` is true when the correlated subquery returns at least one row, and `NOT EXISTS` is true when it returns none. Unlike a `JOIN`, `EXISTS` never repeats the outer row however many matches there are, which makes it the natural way to ask whether a related row exists.",
    prompt: "Return customers who have at least one delivered order with a total of 100 or more, and who have never had an order refunded. Output columns: `id`, `name`. Each customer appears once. Sort by `id`.",
    hint: "One `EXISTS` for the qualifying order and one `NOT EXISTS` for refunds, both correlated on `o.customer_id = c.id`.",
    tables: [customers, ordersWithCustomers],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { customers: SHOP_CUSTOMERS, orders: SHOP_ORDERS } },
      { name: "Several big orders for one customer, and a total of exactly 100", rows: { customers: FEW_CUSTOMERS, orders: [
        [1, 1, "delivered", 150, "2024-01-01 10:00:00"], [2, 1, "delivered", 220, "2024-01-02 10:00:00"], [3, 1, "delivered", 101, "2024-01-03 10:00:00"],
        [4, 2, "delivered", 100, "2024-01-04 10:00:00"], [5, 3, "pending", 500, "2024-01-05 10:00:00"],
      ] } },
      { name: "A refund on a small order still disqualifies", rows: { customers: FEW_CUSTOMERS, orders: [
        [1, 1, "delivered", 250, "2024-02-01 10:00:00"], [2, 1, "refunded", 5, "2024-02-02 10:00:00"], [3, 2, "delivered", 150, "2024-02-03 10:00:00"],
        [4, 2, "cancelled", 20, "2024-02-04 10:00:00"],
      ] } },
      { name: "Nobody qualifies (empty result)", rows: { customers: FEW_CUSTOMERS, orders: [
        [1, 1, "delivered", 99.99, "2024-03-01 10:00:00"], [2, 2, "refunded", 300, "2024-03-02 10:00:00"], [3, 2, "delivered", 300, "2024-03-03 10:00:00"],
      ] } },
    ],
    starter: sql`
SELECT c.id, c.name
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
WHERE o.total >= 100
ORDER BY c.id;
`,
    solution: sql`
SELECT c.id, c.name
FROM customers AS c
WHERE EXISTS (
        SELECT 1 FROM orders AS o
        WHERE o.customer_id = c.id
          AND o.status = 'delivered'
          AND o.total >= 100)
  AND NOT EXISTS (
        SELECT 1 FROM orders AS o
        WHERE o.customer_id = c.id
          AND o.status = 'refunded')
ORDER BY c.id;
`,
  },

  // ---------------------------------------------------------------- NULL handling
  {
    kind: "query",
    id: "total-compensation",
    title: "Total pay with missing bonuses",
    topic: "NULL handling",
    difficulty: "Easy",
    concept: "Arithmetic with NULL gives NULL, so `salary + bonus` is NULL whenever bonus is missing. `COALESCE(a, b, ...)` returns its first non-NULL argument, which makes it the standard way to substitute a default. The same trick labels unmatched rows after a `LEFT JOIN`, e.g. `COALESCE(d.name, 'Unassigned')`.",
    prompt: "For every employee, return `name`, `department` (the department's name, or `'Unassigned'` when the employee has no department) and `total_comp` (salary plus bonus, counting a missing bonus as 0). Sort by `total_comp` from highest to lowest, then by `name` A to Z.",
    hint: "`LEFT JOIN departments` so employees without a department stay in the result.",
    tables: [departments, employees],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { departments: HR_DEPARTMENTS, employees: HR_EMPLOYEES } },
      { name: "Missing and zero bonuses", rows: { departments: [[1, "Engineering"], [2, "Sales"]], employees: [
        [1, "Ivy Nakamura", 1, null, 100000, null, "2020-01-01"], [2, "Jack Reyes", 2, 1, 90000, 0, "2021-01-01"],
        [3, "Kai Moreno", 2, 1, 90000, null, "2022-01-01"], [4, "Lou Tran", 1, 1, 80000, 15000, "2023-01-01"],
      ] } },
      { name: "Nobody has a department", rows: { departments: [[1, "Engineering"]], employees: [
        [1, "Moe Arden", null, null, 70000, 5000, "2020-05-05"], [2, "Nia Brooks", null, 1, 65000, null, "2022-06-06"],
      ] } },
    ],
    starter: sql`
SELECT e.name, d.name AS department, e.salary + e.bonus AS total_comp
FROM employees AS e
JOIN departments AS d ON d.id = e.department_id
ORDER BY total_comp DESC, e.name;
`,
    solution: sql`
SELECT e.name,
       COALESCE(d.name, 'Unassigned') AS department,
       e.salary + COALESCE(e.bonus, 0) AS total_comp
FROM employees AS e
LEFT JOIN departments AS d ON d.id = e.department_id
ORDER BY total_comp DESC, e.name;
`,
  },

  // ---------------------------------------------------------------- conditional aggregation
  {
    kind: "query",
    id: "order-status-breakdown",
    title: "Status breakdown per customer",
    topic: "Conditional aggregation",
    difficulty: "Medium",
    concept: "An aggregate wrapped around a `CASE` expression counts or sums only the rows that meet a condition, giving several filtered totals in one pass, like a pivot. `SUM(CASE WHEN ... THEN x END)` is NULL when no row matches, so add `ELSE 0` when you need a number. Multiply by `100.0` before dividing, because integer division truncates.",
    prompt: "For each customer who has placed at least one order, return `customer_id`, `total_orders`, `delivered_revenue` (the sum of totals of their delivered orders, rounded to 2 decimals, and 0 if they have none) and `cancel_rate` (the percentage of their orders with status `'cancelled'`, rounded to 1 decimal place, e.g. 33.3). Sort by `customer_id`.",
    hint: "`ROUND(100.0 * SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*), 1)`",
    tables: [orders],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { orders: SHOP_ORDERS } },
      { name: "Customers with no delivered orders", rows: { orders: [
        [1, 1, "cancelled", 30, "2024-01-01 10:00:00"], [2, 1, "cancelled", 40, "2024-01-02 10:00:00"], [3, 2, "cancelled", 30, "2024-01-03 10:00:00"],
        [4, 2, "delivered", 19.99, "2024-01-04 10:00:00"], [5, 2, "delivered", 5.01, "2024-01-05 10:00:00"],
      ] } },
      { name: "Two of three cancelled rounds to 66.7", rows: { orders: [
        [1, 4, "cancelled", 10, "2024-02-01 10:00:00"], [2, 4, "cancelled", 10, "2024-02-02 10:00:00"], [3, 4, "delivered", 12.5, "2024-02-03 10:00:00"],
        [4, 6, "refunded", 80, "2024-02-04 10:00:00"],
      ] } },
      { name: "No orders (empty result)", rows: { orders: [] } },
    ],
    starter: sql`
SELECT customer_id,
       COUNT(*) AS total_orders,
       SUM(total) AS delivered_revenue,
       0 AS cancel_rate
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
`,
    solution: sql`
SELECT customer_id,
       COUNT(*) AS total_orders,
       ROUND(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 2) AS delivered_revenue,
       ROUND(100.0 * SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*), 1) AS cancel_rate
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
`,
  },

  // ---------------------------------------------------------------- deduplication
  {
    kind: "query",
    id: "first-signup-per-email",
    title: "Keep the first signup per email",
    topic: "Deduplication",
    difficulty: "Medium",
    concept: "`DISTINCT` removes only rows that are identical in every selected column, so it can't dedupe rows that differ in an id or a timestamp. To keep one winning row per key, number the rows with `ROW_NUMBER() OVER (PARTITION BY key ORDER BY ...)` and keep row 1. The window's `ORDER BY` decides the winner, so give it a tie-breaker.",
    prompt: "A bulk import created duplicate signups, and the same email can appear with different capitalisation. Keep only the earliest signup for each email, comparing emails case-insensitively. If two signups for an email share the earliest timestamp, keep the one with the lower id. Return the surviving rows with columns `id`, `email` (as stored in that row), `signed_up_at`, `source`. Sort by `id`.",
    hint: "`PARTITION BY LOWER(email) ORDER BY signed_up_at, id`, inside a CTE, then filter on the row number.",
    tables: [signups],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { signups: [
        [1, "maya@example.com", "2024-03-01 10:00:00", "web"], [2, "leo@example.com", "2024-03-01 11:30:00", "ios"],
        [3, "Maya@Example.com", "2024-02-28 09:00:00", "android"], [4, "sven@example.com", "2024-03-02 08:00:00", "web"],
        [5, "leo@example.com", "2024-03-05 12:00:00", "web"], [6, "ivy@example.com", "2024-03-03 07:45:00", null],
        [7, "SVEN@example.com", "2024-03-02 08:00:00", "import"],
      ] } },
      { name: "No duplicates at all", rows: { signups: [
        [1, "a@example.com", "2024-01-01 00:00:00", "web"], [2, "b@example.com", "2024-01-01 00:00:00", "ios"], [3, "c@example.com", "2023-12-31 00:00:00", null],
      ] } },
      { name: "Identical rows apart from the id", rows: { signups: [
        [12, "dup@example.com", "2024-01-01 00:00:00", "web"], [10, "dup@example.com", "2024-01-01 00:00:00", "web"],
        [11, "dup@example.com", "2024-01-01 00:00:00", "web"], [13, "solo@example.com", "2024-01-02 00:00:00", "ios"],
      ] } },
      { name: "The earliest signup has the higher id", rows: { signups: [
        [1, "kim@example.com", "2024-05-02 09:00:00", "web"], [2, "KIM@example.com", "2024-05-01 18:30:00", "ios"], [3, "lee@example.com", "2024-05-03 10:00:00", null],
      ] } },
    ],
    starter: sql`
SELECT DISTINCT id, email, signed_up_at, source
FROM signups
ORDER BY id;
`,
    solution: sql`
WITH ranked AS (
  SELECT id, email, signed_up_at, source,
         ROW_NUMBER() OVER (
           PARTITION BY LOWER(email)
           ORDER BY signed_up_at, id
         ) AS rn
  FROM signups
)
SELECT id, email, signed_up_at, source
FROM ranked
WHERE rn = 1
ORDER BY id;
`,
  },

  // ---------------------------------------------------------------- window functions
  {
    kind: "query",
    id: "salary-rank-in-department",
    title: "Rank salaries within each department",
    topic: "Window functions",
    difficulty: "Medium",
    concept: "A window function computes a value for each row from a set of related rows without collapsing them as `GROUP BY` does. `PARTITION BY` restarts the calculation for each group, and the `ORDER BY` inside `OVER` sets the ranking order. On ties, `ROW_NUMBER` numbers arbitrarily (1, 2, 3), `RANK` shares a rank then skips (1, 1, 3), and `DENSE_RANK` shares one without gaps (1, 1, 2).",
    prompt: "Rank employees by salary within their department, highest salary first. Employees with equal salaries share a rank, and the next lower salary gets the next consecutive rank (1, 1, 2). Leave out employees who have no department. Output columns: `department_id`, `name`, `salary`, `salary_rank`. Sort by `department_id`, then `salary_rank`, then `name`.",
    hint: "`DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)`",
    tables: [employees],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { employees: HR_EMPLOYEES } },
      { name: "Ties share a rank (1, 1, 2)", rows: { employees: [
        [1, "Ada Moss", 1, null, 100000, null, "2020-01-01"], [2, "Bea Kerr", 1, 1, 100000, null, "2020-02-01"], [3, "Cy Dunn", 1, 1, 90000, null, "2020-03-01"],
        [4, "Dov Hart", 1, 1, 80000, null, "2020-04-01"], [5, "Eve Sato", 1, 1, 80000, null, "2020-05-01"],
      ] } },
      { name: "A one-person department and an unassigned employee", rows: { employees: [
        [1, "Fen Wu", 5, null, 50000, null, "2021-01-01"], [2, "Gil Ames", null, null, 99000, null, "2021-02-01"],
        [3, "Hal Iver", 2, null, 70000, null, "2021-03-01"], [4, "Ike Obi", 2, 3, 70000, null, "2021-04-01"],
      ] } },
    ],
    starter: sql`
SELECT department_id, name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS salary_rank
FROM employees
WHERE department_id IS NOT NULL
ORDER BY department_id, salary_rank, name;
`,
    solution: sql`
SELECT department_id, name, salary,
       DENSE_RANK() OVER (
         PARTITION BY department_id
         ORDER BY salary DESC
       ) AS salary_rank
FROM employees
WHERE department_id IS NOT NULL
ORDER BY department_id, salary_rank, name;
`,
  },
  {
    kind: "query",
    id: "latest-two-orders",
    title: "Each customer's two latest orders",
    topic: "Window functions",
    difficulty: "Medium",
    concept: "For 'top N per group', number the rows inside each group with `ROW_NUMBER() OVER (PARTITION BY group ORDER BY ...)` in a CTE or subquery, then keep rows numbered N or less. You can't filter on a window function in the same query's `WHERE`, because windows are computed after `WHERE` runs. A tie-breaker in the window's `ORDER BY` keeps the result deterministic.",
    prompt: "For each customer, return their two most recent orders (any status). If two orders share a `created_at` timestamp, the one with the higher id counts as more recent. A customer with only one order returns just that order. Output columns: `customer_id`, `order_id`, `created_at`, `total`. Sort by `customer_id`, then `created_at` from newest to oldest, then `order_id` from highest to lowest.",
    hint: "`LIMIT` applies to the whole result, not to each customer. Rank inside each customer with `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, id DESC)`.",
    tables: [orders],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { orders: SHOP_ORDERS } },
      { name: "Same timestamp: the higher id is more recent", rows: { orders: [
        [1, 1, "delivered", 10, "2024-05-01 10:00:00"], [2, 1, "delivered", 20, "2024-05-03 09:00:00"], [3, 1, "pending", 30, "2024-05-03 09:00:00"],
        [4, 1, "delivered", 40, "2024-04-30 08:00:00"], [5, 2, "delivered", 50, "2024-05-03 09:00:00"],
      ] } },
      { name: "One customer with many orders", rows: { orders: [
        [11, 7, "delivered", 11, "2024-01-01 12:00:00"], [12, 7, "delivered", 12, "2024-02-01 12:00:00"], [13, 7, "cancelled", 13, "2024-03-01 12:00:00"],
        [14, 7, "delivered", 14, "2024-04-01 12:00:00"], [15, 7, "pending", 15, "2024-05-01 12:00:00"], [16, 8, "delivered", 16, "2024-02-02 12:00:00"],
        [17, 8, "delivered", 17, "2024-01-01 12:00:00"],
      ] } },
      { name: "No orders (empty result)", rows: { orders: [] } },
    ],
    starter: sql`
SELECT customer_id, id AS order_id, created_at, total
FROM orders
ORDER BY customer_id, created_at DESC, order_id DESC
LIMIT 2;
`,
    solution: sql`
WITH ranked AS (
  SELECT customer_id, id AS order_id, created_at, total,
         ROW_NUMBER() OVER (
           PARTITION BY customer_id
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM orders
)
SELECT customer_id, order_id, created_at, total
FROM ranked
WHERE rn <= 2
ORDER BY customer_id, created_at DESC, order_id DESC;
`,
  },
  {
    kind: "query",
    id: "running-revenue",
    title: "Running revenue by day",
    topic: "Window functions",
    difficulty: "Medium",
    concept: "`SUM(x) OVER (ORDER BY day)` is a running total: each row adds up everything from the first row through the current one. A window never collapses rows, so to get one row per day, aggregate per day first (in a CTE) and then apply the window.",
    prompt: "Payments can arrive several times a day, and refunds are stored as negative amounts. Return one row per day that has payments: `day`, `revenue` (that day's net total) and `running_revenue` (the net total from the first day through that day). Round both to 2 decimals. Sort by `day`.",
    hint: "A CTE with `GROUP BY paid_on`, then `SUM(revenue) OVER (ORDER BY day)` on top of it.",
    tables: [payments],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { payments: [
        [1, "2024-06-01", 120], [2, "2024-06-01", 35.5], [3, "2024-06-02", 80.25], [4, "2024-06-04", 200], [5, "2024-06-04", -35.5], [6, "2024-06-05", 10],
      ] } },
      { name: "Payments stored out of date order", rows: { payments: [
        [1, "2024-07-03", 50], [2, "2024-07-01", 20], [3, "2024-07-02", 30], [4, "2024-07-01", 5],
      ] } },
      { name: "A day that nets to zero", rows: { payments: [
        [1, "2024-08-01", 100], [2, "2024-08-02", 40], [3, "2024-08-02", -40], [4, "2024-08-03", 0.1], [5, "2024-08-03", 0.2],
      ] } },
      { name: "A single payment", rows: { payments: [[1, "2024-09-09", 19.99]] } },
    ],
    starter: sql`
SELECT paid_on AS day,
       amount AS revenue,
       SUM(amount) OVER (ORDER BY id) AS running_revenue
FROM payments
ORDER BY day;
`,
    solution: sql`
WITH daily AS (
  SELECT paid_on AS day, SUM(amount) AS revenue
  FROM payments
  GROUP BY paid_on
)
SELECT day,
       ROUND(revenue, 2) AS revenue,
       ROUND(SUM(revenue) OVER (ORDER BY day), 2) AS running_revenue
FROM daily
ORDER BY day;
`,
  },
  {
    kind: "query",
    id: "day-over-day-active-users",
    title: "Day-over-day change with LAG",
    topic: "Window functions",
    difficulty: "Medium",
    concept: "`LAG(col) OVER (ORDER BY day)` returns the value from the previous row in that order, or NULL on the first row; `LEAD` looks forward. Wrap a divisor in `NULLIF(x, 0)` so dividing by zero gives NULL. SQLite returns NULL for division by zero anyway, but PostgreSQL raises an error.",
    prompt: "For each recorded day, return `day`, `active_users`, `change` (active_users minus the previous recorded day's value) and `pct_change` (that change as a percentage of the previous value, rounded to 1 decimal). On the first day both are NULL, and pct_change is also NULL when the previous day had 0 users. 'Previous' means the previous row by date, even when days are missing in between. Sort by `day`.",
    hint: "Compute `LAG(active_users) OVER (ORDER BY day)` in a CTE, then `ROUND(100.0 * (active_users - prev) / NULLIF(prev, 0), 1)`.",
    tables: [dailyActive],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { daily_active: [
        ["2024-09-01", 1200], ["2024-09-02", 1350], ["2024-09-03", 1290], ["2024-09-05", 1290], ["2024-09-06", 1548],
      ] } },
      { name: "The previous day had zero users", rows: { daily_active: [["2024-01-01", 0], ["2024-01-02", 40], ["2024-01-03", 10]] } },
      { name: "Rows stored out of date order", rows: { daily_active: [["2024-03-03", 300], ["2024-03-01", 100], ["2024-03-02", 150]] } },
      { name: "A single day", rows: { daily_active: [["2024-02-29", 500]] } },
    ],
    starter: sql`
SELECT day, active_users,
       0 AS change,
       0 AS pct_change
FROM daily_active
ORDER BY day;
`,
    solution: sql`
WITH with_prev AS (
  SELECT day, active_users,
         LAG(active_users) OVER (ORDER BY day) AS prev_users
  FROM daily_active
)
SELECT day, active_users,
       active_users - prev_users AS change,
       ROUND(100.0 * (active_users - prev_users) / NULLIF(prev_users, 0), 1) AS pct_change
FROM with_prev
ORDER BY day;
`,
  },

  // ---------------------------------------------------------------- CTEs
  {
    kind: "query",
    id: "category-best-sellers",
    title: "Best seller in each category",
    topic: "CTEs",
    difficulty: "Hard",
    concept: "A CTE (`WITH name AS (...)`) names an intermediate result, so a multi-step query reads top to bottom and later steps can refer to it, even more than once. A common shape is to aggregate in one CTE, find each group's maximum in the next, then join the two in the final `SELECT`.",
    prompt: "Find the best-selling product in each category, measured by total units sold across all order items. If several products tie for the most units in a category, return all of them. Ignore products that never sold. Output columns: `category`, `product`, `units_sold`. Sort by `category`, then `product`.",
    hint: "CTE 1: units sold per product. CTE 2: the top units per category. Final query: join them on category and units.",
    tables: [products, orderItems],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: {
        products: [
          [1, "Trail Runner", "Shoes", 120], [2, "City Sneaker", "Shoes", 90], [3, "Rain Shell", "Jackets", 150],
          [4, "Down Parka", "Jackets", 260], [5, "Wool Beanie", "Accessories", 25], [6, "Leather Belt", "Accessories", 40],
        ],
        order_items: [
          [1001, 1, 2], [1001, 5, 1], [1002, 2, 3], [1003, 1, 1], [1003, 3, 1], [1004, 4, 1], [1005, 3, 1], [1006, 6, 1], [1006, 5, 1], [1007, 2, 1],
        ],
      } },
      { name: "Two products tie for the top spot", rows: {
        products: [[1, "Alpine Boot", "Shoes", 180], [2, "Court Classic", "Shoes", 95], [3, "Slip-On", "Shoes", 60], [4, "Fleece Vest", "Jackets", 70]],
        order_items: [[1, 1, 3], [2, 1, 2], [2, 2, 5], [3, 3, 2], [4, 4, 1]],
      } },
      { name: "Unsold products and a category with no sales", rows: {
        products: [[1, "Canvas Tote", "Bags", 30], [2, "Laptop Sleeve", "Bags", 45], [3, "Silk Scarf", "Accessories", 55], [4, "Sun Hat", "Accessories", 35]],
        order_items: [[1, 3, 1], [2, 3, 2], [3, 4, 1]],
      } },
      { name: "Many small orders beat one big order", rows: {
        products: [[1, "Wool Socks", "Accessories", 12], [2, "Gift Box", "Accessories", 20]],
        order_items: [[1, 1, 1], [2, 1, 1], [3, 1, 1], [4, 1, 1], [5, 1, 1], [6, 1, 1], [7, 1, 1], [8, 1, 1], [9, 1, 1], [10, 1, 1], [11, 2, 8]],
      } },
    ],
    starter: sql`
SELECT p.category, p.name AS product, MAX(oi.quantity) AS units_sold
FROM order_items AS oi
JOIN products AS p ON p.id = oi.product_id
GROUP BY p.category
ORDER BY p.category, product;
`,
    solution: sql`
WITH units AS (
  SELECT p.category, p.name AS product, SUM(oi.quantity) AS units_sold
  FROM order_items AS oi
  JOIN products AS p ON p.id = oi.product_id
  GROUP BY p.id, p.category, p.name
),
best AS (
  SELECT category, MAX(units_sold) AS top_units
  FROM units
  GROUP BY category
)
SELECT u.category, u.product, u.units_sold
FROM units AS u
JOIN best AS b
  ON b.category = u.category
 AND b.top_units = u.units_sold
ORDER BY u.category, u.product;
`,
  },

  // ---------------------------------------------------------------- dates
  {
    kind: "query",
    id: "monthly-revenue",
    title: "Monthly revenue buckets",
    topic: "Dates",
    difficulty: "Easy",
    concept: "SQLite stores dates as ISO-8601 text, and `strftime(format, value)` extracts parts of them: `strftime('%Y-%m', '2024-03-15 16:20:00')` is `'2024-03'`, a month bucket you can `GROUP BY`. ISO strings sort chronologically, so range filters such as `created_at >= '2024-01-01'` work directly. In PostgreSQL you'd use `date_trunc('month', ts)`.",
    prompt: "Report revenue from delivered orders for each calendar month of 2024. Return `month` (formatted `'YYYY-MM'`), `orders` (the number of delivered orders) and `revenue` (the sum of their totals, rounded to 2 decimals). Include only months with at least one delivered order. Sort by `month`.",
    hint: "`GROUP BY strftime('%Y-%m', created_at)`, and keep the year filter in `WHERE`.",
    tables: [orders],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { orders: SHOP_ORDERS } },
      { name: "Orders at month and year boundaries", rows: { orders: [
        [1, 1, "delivered", 10, "2023-12-31 23:59:59"], [2, 1, "delivered", 20, "2024-01-31 23:59:59"], [3, 2, "delivered", 30, "2024-02-01 00:00:00"],
        [4, 2, "delivered", 40.5, "2024-02-29 23:00:00"], [5, 3, "delivered", 50, "2025-01-01 00:00:00"],
      ] } },
      { name: "A month with only cancelled orders is left out", rows: { orders: [
        [1, 1, "delivered", 15, "2024-01-10 10:00:00"], [2, 1, "cancelled", 99, "2024-03-03 10:00:00"], [3, 2, "delivered", 25, "2024-04-04 10:00:00"],
        [4, 2, "refunded", 60, "2024-04-05 10:00:00"],
      ] } },
      { name: "No delivered orders in 2024 (empty result)", rows: { orders: [
        [1, 1, "pending", 10, "2024-05-05 10:00:00"], [2, 1, "delivered", 10, "2023-05-05 10:00:00"],
      ] } },
    ],
    starter: sql`
SELECT created_at AS month,
       COUNT(*) AS orders,
       ROUND(SUM(total), 2) AS revenue
FROM orders
WHERE status = 'delivered'
GROUP BY created_at
ORDER BY month;
`,
    solution: sql`
SELECT strftime('%Y-%m', created_at) AS month,
       COUNT(*) AS orders,
       ROUND(SUM(total), 2) AS revenue
FROM orders
WHERE status = 'delivered'
  AND created_at >= '2024-01-01'
  AND created_at < '2025-01-01'
GROUP BY month
ORDER BY month;
`,
  },

  // ---------------------------------------------------------------- second highest
  {
    kind: "query",
    id: "runner-up-score",
    title: "Runner-up score with ties",
    topic: "Subqueries",
    difficulty: "Medium",
    concept: "'Second highest' usually means the second-highest distinct value. Take the maximum below the overall maximum, `MAX(x) WHERE x < (SELECT MAX(x) ...)`, or keep `DENSE_RANK() = 2`. `ORDER BY ... LIMIT 1 OFFSET 1` is a trap: it counts rows, not distinct values, so it returns the top value again when two rows tie for first.",
    prompt: "Return every player whose score equals the second-highest distinct score. If several players share that score, return all of them; if there is no second-highest score (one distinct score, or none), return no rows. Players with a NULL score haven't played yet and are ignored. Output columns: `player`, `points`. Sort by `player`.",
    hint: "The inner query finds the maximum; the middle one finds the maximum below it; the outer one returns every player with that score.",
    tables: [scores],
    ordered: true,
    datasets: [
      { name: SAMPLE, rows: { scores: [["Avery", 870], ["Blake", 940], ["Casey", 870], ["Devon", 910], ["Emery", null], ["Finley", 940]] } },
      { name: "Several players share the second-highest score", rows: { scores: [["Arin", 50], ["Bo", 40], ["Cleo", 40], ["Dara", 10]] } },
      { name: "Everyone has the same score (empty result)", rows: { scores: [["Eli", 70], ["Fern", 70], ["Gray", 70]] } },
      { name: "Only one real score besides NULLs (empty result)", rows: { scores: [["Hollis", null], ["Indy", 30], ["Jules", null]] } },
    ],
    starter: sql`
SELECT player, points
FROM scores
ORDER BY points DESC
LIMIT 1 OFFSET 1;
`,
    solution: sql`
SELECT player, points
FROM scores
WHERE points = (
  SELECT MAX(points)
  FROM scores
  WHERE points < (SELECT MAX(points) FROM scores)
)
ORDER BY player;
`,
  },

  // ---------------------------------------------------------------- indexing
  {
    kind: "index",
    id: "index-case-insensitive-email",
    title: "Index a case-insensitive lookup",
    topic: "Indexing",
    difficulty: "Medium",
    concept: "An index keeps a column's values sorted, so `WHERE email = ?` can jump straight to the matches. Wrapping the column in a function, as in `lower(email)`, hides it from an ordinary index, and the database falls back to reading every row. Either index the expression itself or store a normalised copy of the column.",
    prompt: "The login service runs the query below, and `EXPLAIN QUERY PLAN` shows `SCAN users`: every login reads the whole table. Write the `CREATE INDEX` statement(s) that make SQLite `SEARCH users` through an index for this exact query. The query itself can't change; the checks run it as written.",
    hint: "SQLite (like PostgreSQL) can index an expression: `CREATE INDEX name ON users (lower(email))`.",
    tables: [users],
    ordered: false,
    query: "SELECT id, name FROM users WHERE lower(email) = 'ana.silva@example.com'",
    plan: [{ table: "users" }],
    datasets: [
      { name: SAMPLE, rows: { users: [
        [1, "Ana.Silva@example.com", "Ana Silva", "2023-01-10"], [2, "ben.okoro@example.com", "Ben Okoro", "2023-02-11"],
        [3, "chloe.w@example.com", "Chloe Wright", "2023-03-12"], [4, "DMITRI@EXAMPLE.COM", "Dmitri Volkov", "2023-04-13"],
      ] } },
      { name: "The same address stored in two cases", rows: { users: [
        [1, "ana.silva@example.com", "Ana Silva", "2023-01-10"], [2, "ANA.SILVA@EXAMPLE.COM", "Ana Silva (old account)", "2021-06-30"],
        [3, "ben.okoro@example.com", "Ben Okoro", "2023-02-11"],
      ] } },
      { name: "No matching user", rows: { users: [[1, "ben.okoro@example.com", "Ben Okoro", "2023-02-11"]] } },
    ],
    starter: sql`
CREATE INDEX idx_users_email ON users (email);
`,
    solution: sql`
CREATE INDEX idx_users_email_lower ON users (lower(email));
`,
  },
  {
    kind: "index",
    id: "index-composite-column-order",
    title: "Column order in a composite index",
    topic: "Indexing",
    difficulty: "Medium",
    concept: "A composite index is sorted by its first column, then by the second within each first-column value, like a phone book sorted by surname, then first name. It can narrow on equality columns first, then on one range column, and return rows already in that order. Put equality columns before range or sort columns: `(customer_id, created_at)` serves this query, while `(created_at, customer_id)` can only use the date range.",
    prompt: "The order-history page runs the query below. Create one index that lets SQLite narrow the search by both `customer_id` and the `created_at` range, and return the rows already sorted, with no temporary B-tree.",
    hint: "Equality column first, then the range column, which is also the sort column.",
    tables: [orders],
    ordered: true,
    query: "SELECT id, created_at, total FROM orders WHERE customer_id = 2 AND created_at >= '2024-02-01' ORDER BY created_at",
    plan: [{ table: "orders", terms: ["customer_id=?", "created_at>?"], noTempSort: true }],
    datasets: [
      { name: SAMPLE, rows: { orders: SHOP_ORDERS } },
      { name: "An order at exactly 2024-02-01 00:00:00", rows: { orders: [
        [1, 2, "delivered", 10, "2024-01-31 23:59:59"], [2, 2, "delivered", 20, "2024-02-01 00:00:00"], [3, 2, "pending", 30, "2024-02-15 12:00:00"],
        [4, 3, "delivered", 40, "2024-02-10 10:00:00"],
      ] } },
      { name: "The customer has no recent orders", rows: { orders: [[1, 2, "delivered", 10, "2023-11-11 11:11:11"], [2, 5, "delivered", 20, "2024-03-03 03:03:03"]] } },
    ],
    starter: sql`
CREATE INDEX idx_orders_created_customer ON orders (created_at, customer_id);
`,
    solution: sql`
CREATE INDEX idx_orders_customer_created ON orders (customer_id, created_at);
`,
  },
  {
    kind: "index",
    id: "index-covering-account-page",
    title: "A covering index for a hot query",
    topic: "Indexing",
    difficulty: "Hard",
    concept: "After finding a match in an index, the database normally follows a pointer back to the table row to read the other columns. If the index already holds every column the query touches, it is a covering index: the query is answered from the index alone, and `EXPLAIN QUERY PLAN` says `USING COVERING INDEX`. Put the filter and sort columns first and the read-only columns last; PostgreSQL also offers `INCLUDE (...)` for those.",
    prompt: "This query runs on every account page. Create an index that answers it from the index alone (`USING COVERING INDEX`), searching by `customer_id` and reading rows in `created_at` order without a temporary sort.",
    hint: "`customer_id` first (equality), then `created_at` (sort); SQLite can walk an index backwards for `DESC`. Then add the columns that are only read.",
    tables: [orders],
    ordered: true,
    query: "SELECT created_at, status, total FROM orders WHERE customer_id = 3 ORDER BY created_at DESC",
    plan: [{ table: "orders", terms: ["customer_id=?"], covering: true, noTempSort: true }],
    datasets: [
      { name: SAMPLE, rows: { orders: SHOP_ORDERS } },
      { name: "A customer with many orders", rows: { orders: [
        [1, 3, "delivered", 10, "2024-01-01 09:00:00"], [2, 3, "cancelled", 20, "2024-03-01 09:00:00"], [3, 4, "delivered", 30, "2024-02-01 09:00:00"],
        [4, 3, "pending", 40, "2024-02-01 09:00:00"], [5, 3, "delivered", 50, "2024-05-01 09:00:00"], [6, 3, "refunded", 60, "2023-12-24 18:00:00"],
      ] } },
      { name: "The customer has no orders", rows: { orders: [[1, 1, "delivered", 10, "2024-01-01 09:00:00"]] } },
    ],
    starter: sql`
CREATE INDEX idx_orders_customer ON orders (customer_id);
`,
    solution: sql`
CREATE INDEX idx_orders_customer_created_cover
  ON orders (customer_id, created_at, status, total);
`,
  },
];

/** Topics in the order they first appear. */
export const SQL_TOPICS: SqlTopic[] = [...new Set(SQL_CHALLENGES.map(challenge => challenge.topic))];
