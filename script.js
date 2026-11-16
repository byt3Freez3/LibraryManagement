/**
 * Library Management System (Web-Based Variant)
 * Course: IT Workshop - Assignment 1
 * Stack: HTML5 + CSS3 + Vanilla JavaScript (ES6)
 *
 * Implements Tasks 1-7, localStorage persistence, responsive mobile menu,
 * and data-label attributes for mobile table-card transformation.
 */

// ============================================================================
// 1. Data Schema & Global Storage Layer
// ============================================================================

const STORAGE_KEYS = {
  BOOKS: "lms_books",
  ISSUES: "lms_issues",
  NEXT_ISSUE_ID: "lms_nextIssueId"
};

// Seed books (SPEC.md §2.4)
const SEED_BOOKS = [
  { id: "B101", title: "Let Us C", author: "Yashavant Kanetkar", year: 2016, copies: 3 },
  { id: "B102", title: "Data Structures Using C", author: "Reema Thareja", year: 2014, copies: 2 },
  { id: "B103", title: "Introduction to Algorithms", author: "Thomas H. Cormen", year: 2009, copies: 1 },
  { id: "B104", title: "Computer Networks", author: "Andrew S. Tanenbaum", year: 2010, copies: 0 }
];

let books = [];
let issues = [];
let nextIssueId = 1;

/**
 * Save current state to browser localStorage.
 */
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
    localStorage.setItem(STORAGE_KEYS.NEXT_ISSUE_ID, String(nextIssueId));
  } catch (err) {
    console.error("Failed to save data to localStorage:", err);
  }
}

/**
 * Load data from localStorage. Falls back to seed data if missing or corrupted.
 */
function loadData() {
  try {
    const rawBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
    const rawIssues = localStorage.getItem(STORAGE_KEYS.ISSUES);
    const rawNextId = localStorage.getItem(STORAGE_KEYS.NEXT_ISSUE_ID);

    if (!rawBooks) {
      books = JSON.parse(JSON.stringify(SEED_BOOKS));
      issues = [];
      nextIssueId = 1;
      saveData();
    } else {
      books = JSON.parse(rawBooks);
      issues = rawIssues ? JSON.parse(rawIssues) : [];
      nextIssueId = rawNextId ? parseInt(rawNextId, 10) || 1 : 1;
    }
  } catch (err) {
    console.warn("Corrupted localStorage data, resetting to seed data:", err);
    books = JSON.parse(JSON.stringify(SEED_BOOKS));
    issues = [];
    nextIssueId = 1;
    saveData();
    showStatusMessage("Warning: Saved data was invalid and was restored to defaults.", "warning");
  }
}

// ============================================================================
// 2. Helper Functions
// ============================================================================

/**
 * Find a book by ID (case-insensitive, trimmed).
 */
function findBookById(id) {
  if (!id) return undefined;
  const cleanId = String(id).trim().toUpperCase();
  return books.find(b => b.id.toUpperCase() === cleanId);
}

/**
 * Find an active issue record (status === "Issued") for a given book and student.
 */
function findActiveIssue(bookId, studentId) {
  const cleanBookId = String(bookId).trim().toUpperCase();
  const cleanStudentId = String(studentId).trim().toUpperCase();
  return issues.find(i => 
    i.bookId.toUpperCase() === cleanBookId &&
    i.studentId.toUpperCase() === cleanStudentId &&
    i.status === "Issued"
  );
}

/**
 * Return formatted today's date string.
 */
function getTodayDate() {
  return new Date().toLocaleDateString();
}

/**
 * Highlight or remove error styling on an input element.
 */
function setInputError(element, hasError) {
  if (!element) return;
  if (hasError) {
    element.classList.add("input-error");
  } else {
    element.classList.remove("input-error");
  }
}

/**
 * Clear all .input-error highlights from a form.
 */
function clearFormErrors(form) {
  if (!form) return;
  const errorInputs = form.querySelectorAll(".input-error");
  errorInputs.forEach(input => input.classList.remove("input-error"));
}

/**
 * Helper to create a td element with a data-label attribute (Part A2 requirement).
 */
function createTableCell(dataLabel, textContent, className = "") {
  const td = document.createElement("td");
  td.setAttribute("data-label", dataLabel);
  if (className) td.className = className;
  td.textContent = textContent;
  return td;
}

// ============================================================================
// 3. Navigation & Tab Switching (Task 7)
// ============================================================================

/**
 * Switch the visible section/tab using a switch statement (Kotlin 'when' equivalent).
 * Closes mobile navbar menu automatically upon selection.
 * @param {string} sectionId - Target section ID (e.g. 'section-dashboard')
 */
function showSection(sectionId) {
  // 1. Hide all pages
  const pages = document.querySelectorAll(".page");
  pages.forEach(page => {
    page.classList.remove("show");
    page.classList.remove("active");
  });

  // 2. Deactivate all nav buttons
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(btn => btn.classList.remove("active"));

  // 3. Activate target page and nav button
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("show");
    targetSection.classList.add("active");
  }

  const matchingBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
  if (matchingBtn) {
    matchingBtn.classList.add("active");
  }

  // 4. Close mobile menu if open
  closeMobileMenu();

  // 5. Clear status message
  hideStatusMessage();

  // 6. Section-specific rendering via switch
  switch (sectionId) {
    case "section-dashboard":
      renderDashboard();
      break;
    case "section-books":
      renderBooksTable();
      break;
    case "section-search":
      handleSearchInput();
      break;
    case "section-issued":
      renderIssuedTable();
      break;
    case "section-add":
    case "section-issue":
    case "section-return":
    case "section-exit":
    default:
      break;
  }
}

/**
 * Close mobile navigation menu and update aria-expanded.
 */
function closeMobileMenu() {
  const navbar = document.getElementById("mainNavbar");
  const menuToggle = document.getElementById("menuToggle");
  if (navbar) navbar.classList.remove("nav-open");
  if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
}

/**
 * Toggle mobile navigation menu.
 */
function toggleMobileMenu() {
  const navbar = document.getElementById("mainNavbar");
  const menuToggle = document.getElementById("menuToggle");
  if (!navbar) return;

  const isOpen = navbar.classList.toggle("nav-open");
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
}

// ============================================================================
// 4. Status Message Banner
// ============================================================================

/**
 * Show temporary feedback banner.
 * @param {string} message - Message text
 * @param {string} type - 'success' | 'error' | 'warning'
 */
function showStatusMessage(message, type = "success") {
  const banner = document.getElementById("statusMessage");
  if (!banner) return;

  banner.textContent = message;
  banner.className = `status-message show ${type}`;

  clearTimeout(banner.dataset.timer);
  banner.dataset.timer = setTimeout(() => {
    hideStatusMessage();
  }, 4000);
}

/**
 * Hide status banner.
 */
function hideStatusMessage() {
  const banner = document.getElementById("statusMessage");
  if (!banner) return;
  banner.className = "status-message";
  banner.textContent = "";
}

// ============================================================================
// 5. Task 1: Add Book
// ============================================================================

/**
 * Handle Add Book form submission with validation.
 */
function handleAddBook(event) {
  event.preventDefault();
  const form = document.getElementById("addBookForm");
  clearFormErrors(form);

  const idInput = document.getElementById("bookId");
  const titleInput = document.getElementById("bookTitle");
  const authorInput = document.getElementById("bookAuthor");
  const yearInput = document.getElementById("bookYear");
  const copiesInput = document.getElementById("bookCopies");

  const rawId = idInput.value.trim();
  const rawTitle = titleInput.value.trim();
  const rawAuthor = authorInput.value.trim();
  const rawYear = yearInput.value.trim();
  const rawCopies = copiesInput.value.trim();

  // E1: Required check
  if (!rawId) {
    setInputError(idInput, true);
    idInput.focus();
    return showStatusMessage("Book ID is required.", "error");
  }
  if (!rawTitle) {
    setInputError(titleInput, true);
    titleInput.focus();
    return showStatusMessage("Title is required.", "error");
  }
  if (!rawAuthor) {
    setInputError(authorInput, true);
    authorInput.focus();
    return showStatusMessage("Author is required.", "error");
  }
  if (!rawYear) {
    setInputError(yearInput, true);
    yearInput.focus();
    return showStatusMessage("Publication year is required.", "error");
  }
  if (!rawCopies) {
    setInputError(copiesInput, true);
    copiesInput.focus();
    return showStatusMessage("Available copies is required.", "error");
  }

  // E3: No spaces inside Book ID
  if (/\s/.test(rawId)) {
    setInputError(idInput, true);
    idInput.focus();
    return showStatusMessage("Book ID must not contain spaces.", "error");
  }

  // E2: Duplicate Book ID check (case-insensitive)
  const existingBook = findBookById(rawId);
  if (existingBook) {
    setInputError(idInput, true);
    idInput.focus();
    return showStatusMessage(`Book ID ${rawId.toUpperCase()} already exists.`, "error");
  }

  // E4 & E5: Year validation
  const yearNum = Number(rawYear);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(yearNum) || yearNum <= 0) {
    setInputError(yearInput, true);
    yearInput.focus();
    return showStatusMessage("Publication year must be a positive whole number.", "error");
  }
  if (yearNum > currentYear) {
    setInputError(yearInput, true);
    yearInput.focus();
    return showStatusMessage("Publication year cannot be in the future.", "error");
  }

  // E6: Copies validation
  const copiesNum = Number(rawCopies);
  if (!Number.isInteger(copiesNum) || copiesNum < 0) {
    setInputError(copiesInput, true);
    copiesInput.focus();
    return showStatusMessage("Available copies must be a whole number (0 or more).", "error");
  }

  // Push new book, save, and update
  const newBook = {
    id: rawId.toUpperCase(),
    title: rawTitle,
    author: rawAuthor,
    year: yearNum,
    copies: copiesNum
  };

  books.push(newBook);
  saveData();

  form.reset();
  clearFormErrors(form);
  showStatusMessage("Book added successfully.", "success");

  // Keep views in sync
  renderBooksTable();
  renderDashboard();
}

// ============================================================================
// 6. Task 2: Display All Books (Inventory)
// ============================================================================

/**
 * Render inventory table with data-label attributes for mobile responsive cards.
 */
function renderBooksTable() {
  const tbody = document.getElementById("booksBody");
  const countBadge = document.getElementById("bookCount");
  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `Total books: ${books.length}`;
  }

  tbody.innerHTML = "";

  if (books.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "empty-state";
    td.textContent = "No books in the library.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  books.forEach((book, index) => {
    const tr = document.createElement("tr");

    tr.appendChild(createTableCell("S.No", String(index + 1)));
    tr.appendChild(createTableCell("Book ID", book.id));
    tr.appendChild(createTableCell("Title", book.title));
    tr.appendChild(createTableCell("Author", book.author));
    tr.appendChild(createTableCell("Year", String(book.year)));
    tr.appendChild(createTableCell("Available Copies", String(book.copies)));

    const statusTd = document.createElement("td");
    statusTd.setAttribute("data-label", "Status");
    const badge = document.createElement("span");
    badge.className = book.copies > 0 ? "status-badge status-available" : "status-badge status-na";
    badge.textContent = book.copies > 0 ? "Available" : "Not Available";
    statusTd.appendChild(badge);
    tr.appendChild(statusTd);

    tbody.appendChild(tr);
  });
}

// ============================================================================
// 7. Task 3: Search Book
// ============================================================================

/**
 * Perform search by Title or Book ID and render results table with data-label.
 */
function handleSearchInput() {
  const searchInput = document.getElementById("searchInput");
  const resultContainer = document.getElementById("searchResult");
  if (!searchInput || !resultContainer) return;

  const query = searchInput.value.trim().toLowerCase();
  const searchTypeEl = document.querySelector('input[name="searchType"]:checked');
  const searchType = searchTypeEl ? searchTypeEl.value : "title";

  if (!query) {
    resultContainer.innerHTML = '<p class="search-hint">Type a Book ID or Title to search.</p>';
    return;
  }

  let matches = [];
  if (searchType === "id") {
    // Exact match (case-insensitive)
    matches = books.filter(b => b.id.toLowerCase() === query);
  } else {
    // Substring partial match (case-insensitive)
    matches = books.filter(b => b.title.toLowerCase().includes(query));
  }

  if (matches.length === 0) {
    resultContainer.innerHTML = `<p class="search-hint">No book found matching '${escapeHTML(searchInput.value.trim())}'.</p>`;
    return;
  }

  // Build results table
  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>S.No</th>
      <th>Book ID</th>
      <th>Title</th>
      <th>Author</th>
      <th>Year</th>
      <th>Available Copies</th>
      <th>Status</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  matches.forEach((book, index) => {
    const tr = document.createElement("tr");

    tr.appendChild(createTableCell("S.No", String(index + 1)));
    tr.appendChild(createTableCell("Book ID", book.id));
    tr.appendChild(createTableCell("Title", book.title));
    tr.appendChild(createTableCell("Author", book.author));
    tr.appendChild(createTableCell("Year", String(book.year)));
    tr.appendChild(createTableCell("Available Copies", String(book.copies)));

    const statusTd = document.createElement("td");
    statusTd.setAttribute("data-label", "Status");
    const badge = document.createElement("span");
    badge.className = book.copies > 0 ? "status-badge status-available" : "status-badge status-na";
    badge.textContent = book.copies > 0 ? `Available (${book.copies} copies)` : "Not Available";
    statusTd.appendChild(badge);
    tr.appendChild(statusTd);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  resultContainer.innerHTML = "";
  resultContainer.appendChild(table);
}

/**
 * Escape text for safe HTML rendering.
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================================
// 8. Task 4: Issue Book
// ============================================================================

/**
 * Handle Issue Book form submission.
 */
function handleIssueBook(event) {
  event.preventDefault();
  const form = document.getElementById("issueBookForm");
  clearFormErrors(form);

  const bookIdInput = document.getElementById("issueBookId");
  const studentIdInput = document.getElementById("issueStudentId");

  const rawBookId = bookIdInput.value.trim();
  const rawStudentId = studentIdInput.value.trim();

  // E1: Required check
  if (!rawBookId) {
    setInputError(bookIdInput, true);
    bookIdInput.focus();
    return showStatusMessage("Book ID is required.", "error");
  }
  if (!rawStudentId) {
    setInputError(studentIdInput, true);
    studentIdInput.focus();
    return showStatusMessage("Student ID is required.", "error");
  }

  const book = findBookById(rawBookId);

  // E8: Book must exist
  if (!book) {
    setInputError(bookIdInput, true);
    bookIdInput.focus();
    return showStatusMessage(`Book ID ${rawBookId.toUpperCase()} not found.`, "error");
  }

  // E9: Book must have copies > 0
  if (book.copies <= 0) {
    setInputError(bookIdInput, true);
    bookIdInput.focus();
    return showStatusMessage(`No copies of '${book.title}' are available right now.`, "error");
  }

  // E10: Student must not hold an active issue of the same book
  const activeIssue = findActiveIssue(rawBookId, rawStudentId);
  if (activeIssue) {
    setInputError(studentIdInput, true);
    studentIdInput.focus();
    return showStatusMessage(`Student ${rawStudentId.toUpperCase()} has already been issued ${book.id} and has not returned it.`, "error");
  }

  // Process issue
  book.copies -= 1;
  const newIssue = {
    issueId: nextIssueId++,
    bookId: book.id,
    studentId: rawStudentId.toUpperCase(),
    issueDate: getTodayDate(),
    returnDate: "",
    status: "Issued"
  };

  issues.push(newIssue);
  saveData();

  form.reset();
  clearFormErrors(form);
  showStatusMessage(`Book '${book.title}' issued to ${newIssue.studentId}. Copies left: ${book.copies}.`, "success");

  // Keep views in sync
  renderBooksTable();
  renderIssuedTable();
  renderDashboard();
}

// ============================================================================
// 9. Task 5: Return Book
// ============================================================================

/**
 * Handle Return Book form submission.
 */
function handleReturnBook(event) {
  event.preventDefault();
  const form = document.getElementById("returnBookForm");
  clearFormErrors(form);

  const bookIdInput = document.getElementById("returnBookId");
  const studentIdInput = document.getElementById("returnStudentId");

  const rawBookId = bookIdInput.value.trim();
  const rawStudentId = studentIdInput.value.trim();

  // E1: Required check
  if (!rawBookId) {
    setInputError(bookIdInput, true);
    bookIdInput.focus();
    return showStatusMessage("Book ID is required.", "error");
  }
  if (!rawStudentId) {
    setInputError(studentIdInput, true);
    studentIdInput.focus();
    return showStatusMessage("Student ID is required.", "error");
  }

  const book = findBookById(rawBookId);

  // E8: Book exists check
  if (!book) {
    setInputError(bookIdInput, true);
    bookIdInput.focus();
    return showStatusMessage(`Book ID ${rawBookId.toUpperCase()} not found.`, "error");
  }

  // E13-E15: Find matching active issue
  const activeIssue = findActiveIssue(rawBookId, rawStudentId);
  if (!activeIssue) {
    setInputError(bookIdInput, true);
    setInputError(studentIdInput, true);
    return showStatusMessage(`No active issue record found for ${rawBookId.toUpperCase()} and ${rawStudentId.toUpperCase()}. Return rejected.`, "error");
  }

  // Process return
  activeIssue.status = "Returned";
  activeIssue.returnDate = getTodayDate();
  book.copies += 1;
  saveData();

  form.reset();
  clearFormErrors(form);
  showStatusMessage(`Book returned successfully. Copies now: ${book.copies}.`, "success");

  // Keep views in sync
  renderBooksTable();
  renderIssuedTable();
  renderDashboard();
}

// ============================================================================
// 10. Task 6: Display Issued Books
// ============================================================================

/**
 * Render issued books list with data-label attributes for mobile card layout.
 */
function renderIssuedTable() {
  const tbody = document.getElementById("issuedBody");
  const historyCheckbox = document.getElementById("showHistory");
  if (!tbody) return;

  const showHistory = historyCheckbox ? historyCheckbox.checked : false;
  const filteredIssues = showHistory ? issues : issues.filter(i => i.status === "Issued");

  tbody.innerHTML = "";

  if (filteredIssues.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.className = "empty-state";
    td.textContent = showHistory ? "No issue records found." : "No books are currently issued.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  filteredIssues.forEach((issue, index) => {
    const tr = document.createElement("tr");
    const book = findBookById(issue.bookId);
    const bookTitle = book ? book.title : "(unknown)";

    tr.appendChild(createTableCell("S.No", String(index + 1)));
    tr.appendChild(createTableCell("Issue No", String(issue.issueId)));
    tr.appendChild(createTableCell("Book ID", issue.bookId));
    tr.appendChild(createTableCell("Title", bookTitle));
    tr.appendChild(createTableCell("Student ID", issue.studentId));
    tr.appendChild(createTableCell("Issue Date", issue.issueDate));
    tr.appendChild(createTableCell("Return Date", issue.returnDate || "-"));

    const statusTd = document.createElement("td");
    statusTd.setAttribute("data-label", "Status");
    const badge = document.createElement("span");
    badge.className = issue.status === "Issued" ? "status-badge status-issued" : "status-badge status-returned";
    badge.textContent = issue.status;
    statusTd.appendChild(badge);
    tr.appendChild(statusTd);

    tbody.appendChild(tr);
  });
}

// ============================================================================
// 11. Dashboard & Maintenance
// ============================================================================

/**
 * Render dashboard summary stat cards and recent transactions table with data-label.
 */
function renderDashboard() {
  const statTitles = document.getElementById("statTitles");
  const statCopies = document.getElementById("statCopies");
  const statIssued = document.getElementById("statIssued");
  const statTransactions = document.getElementById("statTransactions");
  const recentBody = document.getElementById("recentBody");

  // Calculate statistics
  const totalTitles = books.length;
  let totalCopies = 0;
  for (let i = 0; i < books.length; i++) {
    totalCopies += books[i].copies;
  }

  let activeIssuedCount = 0;
  for (let i = 0; i < issues.length; i++) {
    if (issues[i].status === "Issued") {
      activeIssuedCount++;
    }
  }

  if (statTitles) statTitles.textContent = String(totalTitles);
  if (statCopies) statCopies.textContent = String(totalCopies);
  if (statIssued) statIssued.textContent = String(activeIssuedCount);
  if (statTransactions) statTransactions.textContent = String(issues.length);

  // Render recent 5 transactions
  if (recentBody) {
    recentBody.innerHTML = "";
    const recent = issues.slice(-5).reverse();

    if (recent.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "empty-state";
      td.textContent = "No recent activity.";
      tr.appendChild(td);
      recentBody.appendChild(tr);
    } else {
      recent.forEach(record => {
        const tr = document.createElement("tr");

        tr.appendChild(createTableCell("Issue No", String(record.issueId)));
        tr.appendChild(createTableCell("Book ID", record.bookId));
        tr.appendChild(createTableCell("Student ID", record.studentId));

        const statusTd = document.createElement("td");
        statusTd.setAttribute("data-label", "Status");
        const badge = document.createElement("span");
        badge.className = record.status === "Issued" ? "status-badge status-issued" : "status-badge status-returned";
        badge.textContent = record.status;
        statusTd.appendChild(badge);
        tr.appendChild(statusTd);

        tr.appendChild(createTableCell("Date", record.returnDate || record.issueDate));

        recentBody.appendChild(tr);
      });
    }
  }
}

/**
 * Reset data to initial default state.
 */
function handleResetData() {
  if (window.confirm("Reset all data to default seed books and clear history?")) {
    try {
      localStorage.removeItem(STORAGE_KEYS.BOOKS);
      localStorage.removeItem(STORAGE_KEYS.ISSUES);
      localStorage.removeItem(STORAGE_KEYS.NEXT_ISSUE_ID);
    } catch (e) {
      console.warn("Storage clear error:", e);
    }
    loadData();
    renderDashboard();
    renderBooksTable();
    renderIssuedTable();
    showStatusMessage("Data reset to default successfully.", "success");
  }
}

// ============================================================================
// 12. Application Initialization & Event Wiring
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Load initial data
  loadData();

  // Navigation tab clicks
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-section");
      if (target) showSection(target);
    });
  });

  // Mobile hamburger menu toggle
  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMobileMenu);
  }

  // Back to Menu button in Exit section
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showSection("section-dashboard");
    });
  }

  // Reset Data button
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", handleResetData);
  }

  // Add Book Form
  const addForm = document.getElementById("addBookForm");
  if (addForm) {
    addForm.addEventListener("submit", handleAddBook);
    const clearAddBtn = document.getElementById("clearAddBtn");
    if (clearAddBtn) {
      clearAddBtn.addEventListener("click", () => {
        clearFormErrors(addForm);
        hideStatusMessage();
      });
    }
  }

  // Issue Book Form
  const issueForm = document.getElementById("issueBookForm");
  if (issueForm) {
    issueForm.addEventListener("submit", handleIssueBook);
    const clearIssueBtn = document.getElementById("clearIssueBtn");
    if (clearIssueBtn) {
      clearIssueBtn.addEventListener("click", () => {
        clearFormErrors(issueForm);
        hideStatusMessage();
      });
    }
  }

  // Return Book Form
  const returnForm = document.getElementById("returnBookForm");
  if (returnForm) {
    returnForm.addEventListener("submit", handleReturnBook);
    const clearReturnBtn = document.getElementById("clearReturnBtn");
    if (clearReturnBtn) {
      clearReturnBtn.addEventListener("click", () => {
        clearFormErrors(returnForm);
        hideStatusMessage();
      });
    }
  }

  // Search Section Events
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const searchRadios = document.querySelectorAll('input[name="searchType"]');

  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchInput();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearchInput);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      handleSearchInput();
    });
  }

  searchRadios.forEach(radio => {
    radio.addEventListener("change", handleSearchInput);
  });

  // Issued Books History checkbox
  const showHistoryCheckbox = document.getElementById("showHistory");
  if (showHistoryCheckbox) {
    showHistoryCheckbox.addEventListener("change", renderIssuedTable);
  }

  // Initialize Dashboard view
  showSection("section-dashboard");
});
