const form = document.getElementById("reservationForm");
const generatePdfBtn = document.getElementById("generatePdfBtn");

const fields = {
  guestName: document.getElementById("guestName"),
  arrivalDate: document.getElementById("arrivalDate"),
  departureDate: document.getElementById("departureDate"),
  roomType: document.getElementById("roomType"),
  peopleCount: document.getElementById("peopleCount"),
  peopleNames: document.getElementById("peopleNames"),
  dailyRate: document.getElementById("dailyRate"),
  confirmationNo: document.getElementById("confirmationNo"),
  specialNotes: document.getElementById("specialNotes")
};

const preview = {
  issueDate: document.getElementById("issueDatePreview"),
  guestName: document.getElementById("guestNamePreview"),
  arrivalDate: document.getElementById("arrivalDatePreview"),
  departureDate: document.getElementById("departureDatePreview"),
  roomType: document.getElementById("roomTypePreview"),
  peopleCount: document.getElementById("peopleCountPreview"),
  peopleNames: document.getElementById("peopleNamesPreview"),
  dailyRate: document.getElementById("dailyRatePreview"),
  confirmationNo: document.getElementById("confirmationNoPreview"),
  specialNotes: document.getElementById("specialNotesPreview")
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function sanitize(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : "-";
}

function updatePreview() {
  preview.issueDate.textContent = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date());

  preview.guestName.textContent = sanitize(fields.guestName.value);
  preview.arrivalDate.textContent = formatDate(fields.arrivalDate.value);
  preview.departureDate.textContent = formatDate(fields.departureDate.value);
  preview.roomType.textContent = sanitize(fields.roomType.value || "King Room");
  preview.peopleCount.textContent = sanitize(fields.peopleCount.value);
  preview.peopleNames.textContent = sanitize(fields.peopleNames.value);
  preview.dailyRate.textContent = sanitize(fields.dailyRate.value);
  preview.confirmationNo.textContent = sanitize(fields.confirmationNo.value || "6180");
  preview.specialNotes.textContent = sanitize(fields.specialNotes.value);
}

function setDefaultDates() {
  const now = new Date();
  const arrival = new Date(now);
  arrival.setDate(arrival.getDate() + 1);
  const departure = new Date(now);
  departure.setDate(departure.getDate() + 2);

  fields.arrivalDate.value = arrival.toISOString().slice(0, 10);
  fields.departureDate.value = departure.toISOString().slice(0, 10);
}

async function generatePdf() {
  updatePreview();
  generatePdfBtn.disabled = true;
  generatePdfBtn.textContent = "Generating...";

  const element = document.getElementById("pdfContent");
  const guest = sanitize(fields.guestName.value).replace(/\s+/g, "_");

  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  let clone = null;
  try {
    if (!window.html2canvas) {
      throw new Error("html2canvas library failed to load.");
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("jsPDF library failed to load.");
    }
    clone = element.cloneNode(true);
    clone.id = "pdfContentClone";
    clone.style.width = "210mm";
    clone.style.height = "297mm";
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.position = "fixed";
    clone.style.left = "-10000px";
    clone.style.top = "0";
    clone.style.zIndex = "-1";

    document.body.appendChild(clone);
    const rect = clone.getBoundingClientRect();

    const canvas = await window.html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      x: 0,
      y: 0,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      windowWidth: Math.round(rect.width),
      windowHeight: Math.round(rect.height),
      scrollX: 0,
      scrollY: 0
    });

    document.body.removeChild(clone);
    clone = null;

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new window.jspdf.jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    pdf.save(`Reservation_Confirmation_${guest}.pdf`);
  } catch (error) {
    // Show a visible message instead of failing silently.
    console.error(error);
    alert(`PDF generation failed: ${error.message}`);
  } finally {
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
    generatePdfBtn.disabled = false;
    generatePdfBtn.textContent = "Generate PDF";
  }
}

setDefaultDates();
updatePreview();

Object.values(fields).forEach((input) => {
  input.addEventListener("input", updatePreview);
  input.addEventListener("change", updatePreview);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generatePdf();
});

generatePdfBtn.addEventListener("click", generatePdf);
