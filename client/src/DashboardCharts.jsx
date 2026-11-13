
import { useMemo, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import "./DashboardCharts.css";

const chartColors = [
  "#4F79B5",
  "#D98291",
  "#287D6E",
  "#365F9D",
  "#B96779",
  "#3C8F80",
];

const money = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

function getLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDateOffset(daysAgo) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);

  return getLocalDate(date);
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="chart-card">
      <div className="chart-card-heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {children}
    </section>
  );
}

function EmptyChart({ message }) {
  return <div className="chart-empty">{message}</div>;
}

function StatCard({ title, value, subtitle, icon, variant }) {
  return (
    <div className={`analytics-stat-card ${variant || ""}`}>
      <div className="analytics-stat-top">
        <span>{title}</span>
        <span className="analytics-stat-icon">{icon}</span>
      </div>

      <h3>{value}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

export default function DashboardCharts({
  sales = [],
  products = [],
}) {
  const [period, setPeriod] = useState("7");
  const [customStart, setCustomStart] = useState(
    getDateOffset(6)
  );
  const [customEnd, setCustomEnd] = useState(getLocalDate(new Date()));

  const today = getLocalDate(new Date());

  const dateRange = useMemo(() => {
    if (period === "custom") {
      const start = customStart || today;
      const end = customEnd || today;

      return start <= end
        ? { start, end }
        : { start: end, end: start };
    }

    const days = Number(period);

    return {
      start: getDateOffset(days - 1),
      end: today,
    };
  }, [period, customStart, customEnd, today]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (!sale.createdAt) return false;

      const saleDate = getLocalDate(new Date(sale.createdAt));

      return (
        saleDate >= dateRange.start &&
        saleDate <= dateRange.end
      );
    });
  }, [sales, dateRange]);

  const analytics = useMemo(() => {
    let revenue = 0;
    let unitsSold = 0;
    let totalCost = 0;
    let hasCompleteCost = true;

    const productMap = {};
    const paymentMap = {};

    filteredSales.forEach((sale) => {
      revenue += Number(sale.total || 0);

      const method = sale.paymentMethod || "Other";

      paymentMap[method] =
        (paymentMap[method] || 0) + Number(sale.total || 0);

      (sale.items || []).forEach((item) => {
        const quantity = Math.max(
          0,
          Number(item.quantity || 0)
        );

        unitsSold += quantity;

        const productName =
          item.name ||
          item.productName ||
          item.product?.name ||
          "Unknown product";

        productMap[productName] =
          (productMap[productName] || 0) + quantity;

        const purchasePrice =
          item.purchasePrice ??
          item.costPrice ??
          item.productPurchasePrice;

        if (
          purchasePrice === undefined ||
          purchasePrice === null ||
          purchasePrice === ""
        ) {
          hasCompleteCost = false;
        } else {
          totalCost +=
            Math.max(0, Number(purchasePrice) || 0) * quantity;
        }
      });
    });

    const topProducts = Object.entries(productMap)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const paymentData = Object.entries(paymentMap)
      .map(([name, amount]) => ({
        name,
        revenue: amount,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      revenue,
      unitsSold,
      totalCost,
      grossProfit: revenue - totalCost,
      hasCompleteCost,
      averageBill:
        filteredSales.length > 0
          ? revenue / filteredSales.length
          : 0,
      topProducts,
      paymentData,
    };
  }, [filteredSales]);

  const categoryData = useMemo(() => {
    const categoryMap = {};

    products.forEach((product) => {
      const category = product.category || "Other";

      categoryMap[category] =
        (categoryMap[category] || 0) +
        Math.max(0, Number(product.stock || 0));
    });

    return Object.entries(categoryMap)
      .map(([name, stock]) => ({ name, stock }))
      .filter((item) => item.stock > 0)
      .sort((a, b) => b.stock - a.stock);
  }, [products]);

  const salesTrend = useMemo(() => {
    const dates = [];
    const start = parseLocalDate(dateRange.start);
    const end = parseLocalDate(dateRange.end);

    const cursor = new Date(start);

    while (cursor <= end) {
      const dateKey = getLocalDate(cursor);

      dates.push({
        date: dateKey,
        day: cursor.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        revenue: 0,
        bills: 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const dateMap = {};

    dates.forEach((item) => {
      dateMap[item.date] = item;
    });

    filteredSales.forEach((sale) => {
      const dateKey = getLocalDate(new Date(sale.createdAt));

      if (dateMap[dateKey]) {
        dateMap[dateKey].revenue += Number(sale.total || 0);
        dateMap[dateKey].bills += 1;
      }
    });

    return dates;
  }, [filteredSales, dateRange]);

  const profitLabel = analytics.hasCompleteCost
    ? money(analytics.grossProfit)
    : "Incomplete";

  const profitSubtitle = analytics.hasCompleteCost
    ? "Revenue minus recorded purchase costs"
    : "Update purchase costs for all sold items";

  const rangeLabel =
    period === "custom"
      ? "Custom date range"
      : `Last ${period} days`;

  return (
    <section className="advanced-dashboard">
      <div className="analytics-heading">
        <div>
          <p className="analytics-eyebrow">STORE PERFORMANCE</p>
          <h2>Advanced Analytics</h2>
          <p>
            Understand your sales, inventory and payment activity.
          </p>
        </div>

        <span className="analytics-period">{rangeLabel}</span>
      </div>

      <div className="analytics-filters">
        <div className="period-buttons">
          {[
            { label: "7 Days", value: "7" },
            { label: "30 Days", value: "30" },
            { label: "90 Days", value: "90" },
            { label: "Custom", value: "custom" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                period === option.value ? "active" : ""
              }
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="custom-date-fields">
            <label>
              From
              <input
                type="date"
                value={customStart}
                max={customEnd || today}
                onChange={(event) =>
                  setCustomStart(event.target.value)
                }
              />
            </label>

            <label>
              To
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={today}
                onChange={(event) =>
                  setCustomEnd(event.target.value)
                }
              />
            </label>
          </div>
        )}
      </div>

      <div className="analytics-stats-grid">
        <StatCard
          title="Total Revenue"
          value={money(analytics.revenue)}
          subtitle="Revenue in selected period"
          icon="Rs"
          variant="revenue"
        />

        <StatCard
          title="Total Bills"
          value={filteredSales.length.toLocaleString("en-PK")}
          subtitle="Completed sales"
          icon="B"
          variant="bills"
        />

        <StatCard
          title="Units Sold"
          value={analytics.unitsSold.toLocaleString("en-PK")}
          subtitle="Products sold in this period"
          icon="P"
          variant="units"
        />

        <StatCard
          title="Gross Profit"
          value={profitLabel}
          subtitle={profitSubtitle}
          icon="P"
          variant="profit"
        />
      </div>

      <div className="analytics-average">
        <span>Average Bill Value</span>
        <strong>{money(analytics.averageBill)}</strong>
        <span className="average-note">
          Based on {filteredSales.length} completed bills
        </span>
      </div>

      <div className="charts-grid">
        <ChartCard
          title="Sales Trend"
          subtitle="Daily revenue for the selected date range"
        >
          {filteredSales.length === 0 ? (
            <EmptyChart message="No sales recorded in this date range." />
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <LineChart
                data={salesTrend}
                margin={{ top: 10, right: 12, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#287D6E"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="day"
                  interval="preserveStartEnd"
                  minTickGap={20}
                  tick={{ fontSize: 10, fill: "#7d8997" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fontSize: 10, fill: "#7d8997" }}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `${(value / 1000).toFixed(1)}k`
                      : value
                  }
                />

                <Tooltip
                  formatter={(value, name) => [
                    name === "Revenue" ? money(value) : value,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #eee7e0",
                    fontSize: 12,
                  }}
                />

                <Legend wrapperStyle={{ fontSize: 12 }} />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#4F9687"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#4F9687" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Stock by Category"
          subtitle="Units currently available in inventory"
        >
          {categoryData.length === 0 ? (
            <EmptyChart message="No stock available to display." />
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="stock"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={85}
                  innerRadius={48}
                  paddingAngle={3}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [`${value} units`, "Stock"]}
                />

                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Top-Selling Products"
          subtitle="Top 5 products by units sold in this period"
        >
          {analytics.topProducts.length === 0 ? (
            <EmptyChart message="Product rankings will appear after checkout." />
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={analytics.topProducts}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 12, bottom: 5 }}
              >
                <CartesianGrid
                  stroke="#eeeae5"
                  strokeDasharray="4 4"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#4F79B5" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 10, fill: "#667587" }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => [value, "Units sold"]}
                />

                <Bar
                  dataKey="units"
                  name="Units sold"
                  fill="#668FC4"
                  radius={[0, 7, 7, 0]}
                  maxBarSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Payment Methods"
          subtitle="Revenue grouped by payment method in this period"
        >
          {analytics.paymentData.length === 0 ? (
            <EmptyChart message="Payment breakdown will appear after checkout." />
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie
                  data={analytics.paymentData}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={48}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {analytics.paymentData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [money(value), "Revenue"]}
                />

                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </section>
  );
}
