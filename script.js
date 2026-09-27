// ============================================
// Khata App - Main Logic
// ============================================

let allCustomers = [];
let currentCustomer = null;

// ---------- Helpers ----------
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2200);
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-PK");
}

// ---------- Load Customers ----------
async function loadCustomers() {
  const { data, error } = await supabaseClient
    .from("customers")
    .select("*, transactions(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("Customers load karne me masla hua");
    return;
  }

  allCustomers = data || [];
  renderCustomerList(allCustomers);
  renderTotalDue();
}

function calcCustomerBalance(customer) {
  const txns = customer.transactions || [];
  let debit = 0, credit = 0;
  txns.forEach(t => {
    const total = Number(t.total || (t.quantity * t.price) || t.price || 0);
    if (t.type === "credit") credit += total;
    else debit += total;
  });
  return { debit, credit, balance: debit - credit };
}

function renderTotalDue() {
  let total = 0;
  allCustomers.forEach(c => {
    total += calcCustomerBalance(c).balance;
  });
  document.getElementById("totalDueAmount").textContent = formatMoney(total);
}

function renderCustomerList(list) {
  const container = document.getElementById("customerList");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>Koi customer nahi mila.</p>";
    return;
  }

  list.forEach(c => {
    const { balance } = calcCustomerBalance(c);
    const div = document.createElement("div");
    div.className = "customer-item";
    div.innerHTML = `
      <div>
        <div class="name">${c.name}</div>
        <div class="phone">${c.phone || ""}</div>
      </div>
      <div class="due ${balance <= 0 ? "zero" : ""}">${formatMoney(balance)} Rs</div>
    `;
    div.addEventListener("click", () => openKhata(c.id));
    container.appendChild(div);
  });
}

// ---------- Add Customer ----------
document.getElementById("customerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();

  if (!name) return;

  const { error } = await supabaseClient.from("customers").insert([
    { name, phone, address }
  ]);

  if (error) {
    console.error(error);
    showToast("Customer add nahi hua");
    return;
  }

  document.getElementById("customerForm").reset();
  showToast("Customer add ho gaya");
  loadCustomers();
});

// ---------- Search ----------
document.getElementById("searchCustomer").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = allCustomers.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
  );
  renderCustomerList(filtered);
});

// ---------- Open Khata (Customer Detail) ----------
async function openKhata(customerId) {
  const customer = allCustomers.find(c => c.id === customerId);
  if (!customer) return;

  currentCustomer = customer;

  document.getElementById("khataSection").classList.remove("hidden");
  document.getElementById("khataCustomerName").textContent = `📒 ${customer.name} ka Khata`;

  renderKhataDetail();
  window.scrollTo({ top: document.getElementById("khataSection").offsetTop - 10, behavior: "smooth" });
}

function renderKhataDetail() {
  const { debit, credit, balance } = calcCustomerBalance(currentCustomer);
  document.getElementById("sumDebit").textContent = formatMoney(debit);
  document.getElementById("sumCredit").textContent = formatMoney(credit);
  document.getElementById("sumBalance").textContent = formatMoney(balance);

  const tbody = document.getElementById("txnTableBody");
  tbody.innerHTML = "";

  const txns = (currentCustomer.transactions || []).slice().sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  txns.forEach(t => {
    const total = Number(t.total || (t.quantity * t.price) || t.price || 0);
    const tr = document.createElement("tr");
    tr.className = t.type === "credit" ? "credit-row" : "debit-row";
    tr.innerHTML = `
      <td>${new Date(t.created_at).toLocaleDateString("en-GB")}</td>
      <td>${t.item_name || t.note || "-"}</td>
      <td>${t.quantity ?? "-"}</td>
      <td>${formatMoney(t.price)}</td>
      <td>${formatMoney(total)}</td>
      <td>${t.type === "credit" ? "Payment" : "Udhaar"}</td>
      <td><span class="delete-link" data-id="${t.id}">Delete</span></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".delete-link").forEach(el => {
    el.addEventListener("click", () => deleteTransaction(el.dataset.id));
  });
}

// ---------- Add Transaction ----------
document.getElementById("transactionForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentCustomer) return;

  const type = document.getElementById("transType").value;
  const item_name = document.getElementById("itemName").value.trim();
  const quantity = parseFloat(document.getElementById("itemQty").value) || 1;
  const price = parseFloat(document.getElementById("itemPrice").value);
  const note = document.getElementById("itemNote").value.trim();

  if (isNaN(price)) return;

  const { error } = await supabaseClient.from("transactions").insert([
    {
      customer_id: currentCustomer.id,
      item_name: item_name || (type === "credit" ? "Payment" : "Item"),
      quantity,
      price,
      type,
      note
    }
  ]);

  if (error) {
    console.error(error);
    showToast("Entry add nahi hui");
    return;
  }

  document.getElementById("transactionForm").reset();
  document.getElementById("itemQty").value = 1;
  showToast("Entry add ho gayi");
  await loadCustomers();
  currentCustomer = allCustomers.find(c => c.id === currentCustomer.id);
  renderKhataDetail();
});

// ---------- Delete Transaction ----------
async function deleteTransaction(id) {
  if (!confirm("Ye entry delete karni hai?")) return;

  const { error } = await supabaseClient.from("transactions").delete().eq("id", id);
  if (error) {
    console.error(error);
    showToast("Delete nahi hua");
    return;
  }

  showToast("Entry delete ho gayi");
  await loadCustomers();
  currentCustomer = allCustomers.find(c => c.id === currentCustomer.id);
  renderKhataDetail();
}

// ---------- Back Button ----------
document.getElementById("backBtn").addEventListener("click", () => {
  document.getElementById("khataSection").classList.add("hidden");
  currentCustomer = null;
});

// ---------- Init ----------
loadCustomers();