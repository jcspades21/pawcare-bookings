// =========================================================
// PawCare Bookings — Homework 5: Adding Interactivity
//
// Three interactions, tied directly to High-priority items in
// the Workflow Worksheet's "Planned Interaction Areas":
//   1. Service Selection  -> syncs the service cards with the booking form
//   2. Time Slot Picker   -> generates and validates open slots for a date
//   3. Booking Confirmation -> validates the form, then reveals a summary
// Plus a small character counter on the Contact form's message field.
//
// No backend exists yet, so "available slots" are simulated in the
// browser (see getBookedSlotsForDate). This is called out in the HTML
// comments and the worksheet update as something that gets replaced
// once the Google Apps Script / Calendar integration is built.
// =========================================================

document.addEventListener('DOMContentLoaded', function () {
    initServiceSelection();
    initTimeSlotPicker();
    initBookingForm();
    initContactCharCounter();
    initContactForm();
});

// ---------------------------------------------------------
// 1. Service Selection -> Booking Form sync
// ---------------------------------------------------------
function initServiceSelection() {
    var serviceSelect = document.getElementById('service-type');
    var statusEl = document.getElementById('service-select-status');
    var selectLinks = document.querySelectorAll('.select-service-link');

    function announceSelection() {
        var chosenOption = serviceSelect.options[serviceSelect.selectedIndex];
        statusEl.textContent = 'Selected service: ' + chosenOption.text;
    }

    // Respond to clicking "Select This Service" on a service card.
    selectLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            var serviceValue = link.dataset.service;
            serviceSelect.value = serviceValue;
            serviceSelect.dispatchEvent(new Event('change'));
            announceSelection();
        });
    });

    // Also keep the status text in sync if the visitor changes the
    // dropdown directly instead of using a card link.
    serviceSelect.addEventListener('change', announceSelection);
}

// ---------------------------------------------------------
// 2. Time Slot Picker
// ---------------------------------------------------------
function initTimeSlotPicker() {
    var dateInput = document.getElementById('appointment-date');
    var serviceSelect = document.getElementById('service-type');
    var slotList = document.getElementById('time-slot-list');
    var hiddenTimeInput = document.getElementById('appointment-time');
    var selectedTimeDisplay = document.getElementById('selected-time-display');
    var dateError = document.getElementById('date-error');
    var timeError = document.getElementById('time-error');

    // 30-minute slots, 9AM-5PM, with a 12:00-1:00 lunch break carved out.
    var SLOT_TIMES = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
    var SERVICE_DURATIONS = {
        bath: 30,
        'full-groom': 90,
        'nail-trim': 20
    };

    function getTodayString() {
        var today = new Date();
        var month = String(today.getMonth() + 1).padStart(2, '0');
        var day = String(today.getDate()).padStart(2, '0');
        return today.getFullYear() + '-' + month + '-' + day;
    }

    function isAllowedDate(dateStr) {
        return dateStr && dateStr >= dateInput.min;
    }

    function getAvailableSlotTimes(serviceValue) {
        var duration = SERVICE_DURATIONS[serviceValue] || 30;
        var closingTime = 17 * 60;
        var bufferMinutes = 15;

        return SLOT_TIMES.filter(function (time) {
            var parts = time.split(':');
            var startMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            return startMinutes + duration + bufferMinutes <= closingTime;
        });
    }

    function formatTime12h(time24) {
        var parts = time24.split(':');
        var hour = parseInt(parts[0], 10);
        var minute = parts[1];
        var suffix = hour >= 12 ? 'PM' : 'AM';
        var hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return hour12 + ':' + minute + ' ' + suffix;
    }

    // Deterministic pseudo-"already booked" slots per date, so the
    // same date always shows the same availability, and different
    // dates show different results (simulates reading a real Calendar).
    function getBookedSlotsForDate(dateStr) {
        var seed = 0;
        for (var i = 0; i < dateStr.length; i++) {
            seed += dateStr.charCodeAt(i);
        }
        var bookedCount = 2 + (seed % 3); // 2, 3, or 4 slots booked
        var booked = [];
        var attempt = 0;
        while (booked.length < bookedCount && attempt < SLOT_TIMES.length) {
            var index = (seed * (attempt + 3)) % SLOT_TIMES.length;
            var time = SLOT_TIMES[index];
            if (booked.indexOf(time) === -1) {
                booked.push(time);
            }
            attempt++;
        }
        return booked;
    }

    function clearSelection() {
        hiddenTimeInput.value = '';
        selectedTimeDisplay.textContent = '';
    }

    function renderSlots(dateStr) {
        slotList.innerHTML = '';
        clearSelection();

        var bookedSlots = getBookedSlotsForDate(dateStr);
        var availableSlotTimes = getAvailableSlotTimes(serviceSelect.value);

        availableSlotTimes.forEach(function (time) {
            var li = document.createElement('li');
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'slot-btn';
            button.textContent = formatTime12h(time);
            button.dataset.time = time;
            button.setAttribute('aria-pressed', 'false');

            var isBooked = bookedSlots.indexOf(time) !== -1;

            if (isBooked) {
                button.classList.add('slot-booked');
                button.disabled = true;
                button.setAttribute('aria-label', formatTime12h(time) + ', already booked');
            } else {
                button.addEventListener('click', function () {
                    var allButtons = slotList.querySelectorAll('.slot-btn');
                    allButtons.forEach(function (b) {
                        b.classList.remove('slot-selected');
                        b.setAttribute('aria-pressed', 'false');
                    });
                    button.classList.add('slot-selected');
                    button.setAttribute('aria-pressed', 'true');
                    hiddenTimeInput.value = time;
                    selectedTimeDisplay.textContent = 'Selected time: ' + formatTime12h(time);
                    timeError.hidden = true;
                });
            }

            li.appendChild(button);
            slotList.appendChild(li);
        });
    }

    dateInput.addEventListener('change', function () {
        var value = dateInput.value;

        if (!value) {
            slotList.innerHTML = '<li class="slot-placeholder">Select a date above to see open time slots.</li>';
            clearSelection();
            return;
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var chosenDate = new Date(value + 'T00:00:00');

        // Condition: reject dates in the past before generating slots.
        if (!isAllowedDate(value) || chosenDate < today) {
            dateError.hidden = false;
            dateInput.setAttribute('aria-invalid', 'true');
            slotList.innerHTML = '<li class="slot-placeholder">Please choose today or a later date to see open time slots.</li>';
            clearSelection();
            return;
        }

        dateError.hidden = true;
        dateInput.removeAttribute('aria-invalid');
        renderSlots(value);
    });

    dateInput.min = getTodayString();
    serviceSelect.addEventListener('change', function () {
        if (isAllowedDate(dateInput.value)) {
            renderSlots(dateInput.value);
        }
    });
}

// ---------------------------------------------------------
// 3. Booking Form validation + Confirmation Message
// ---------------------------------------------------------
function initBookingForm() {
    var form = document.querySelector('#book form');
    var petSizeRadios = form.querySelectorAll('input[name="pet-size"]');
    var petSizeError = document.getElementById('pet-size-error');
    var timeInput = document.getElementById('appointment-time');
    var timeError = document.getElementById('time-error');
    var confirmationBox = document.getElementById('booking-confirmation');
    var detailsList = document.getElementById('confirmation-details');
    var slotList = document.getElementById('time-slot-list');
    var selectedTimeDisplay = document.getElementById('selected-time-display');
    var bookAnotherBtn = document.getElementById('book-another-btn');
    var dateInput = document.getElementById('appointment-date');
    var dateError = document.getElementById('date-error');

    function formatTime12h(time24) {
        if (!time24) return '';
        var parts = time24.split(':');
        var hour = parseInt(parts[0], 10);
        var minute = parts[1];
        var suffix = hour >= 12 ? 'PM' : 'AM';
        var hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return hour12 + ':' + minute + ' ' + suffix;
    }

    function addRow(label, value) {
        var dt = document.createElement('dt');
        dt.textContent = label;
        var dd = document.createElement('dd');
        dd.textContent = value;
        detailsList.appendChild(dt);
        detailsList.appendChild(dd);
    }

    function resetBookingState() {
        slotList.innerHTML = '<li class="slot-placeholder">Select a date above to see open time slots.</li>';
        selectedTimeDisplay.textContent = '';
        document.getElementById('service-select-status').textContent = '';
        petSizeError.hidden = true;
        timeError.hidden = true;
        dateError.hidden = true;
        dateInput.removeAttribute('aria-invalid');
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        var isValid = true;

        // Native required/email/date validity for the standard fields.
        if (!form.checkValidity()) {
            form.reportValidity();
            isValid = false;
        }

        var chosenDate = new Date(dateInput.value + 'T00:00:00');
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!dateInput.value || dateInput.value < dateInput.min || chosenDate < today) {
            dateError.hidden = false;
            dateInput.setAttribute('aria-invalid', 'true');
            isValid = false;
        } else {
            dateError.hidden = true;
            dateInput.removeAttribute('aria-invalid');
        }

        // Custom condition: a radio group's required-ness isn't caught
        // reliably above in every browser, so check pet size explicitly.
        var sizeSelected = Array.prototype.some.call(petSizeRadios, function (radio) {
            return radio.checked;
        });
        if (!sizeSelected) {
            petSizeError.hidden = false;
            isValid = false;
        } else {
            petSizeError.hidden = true;
        }

        // Custom condition: a time slot must be chosen from the
        // generated list (there's no native input to validate this).
        if (!timeInput.value) {
            timeError.hidden = false;
            isValid = false;
        } else {
            timeError.hidden = true;
        }

        if (!isValid) {
            return;
        }

        // Build the confirmation summary from the entered values.
        var serviceSelect = document.getElementById('service-type');
        var serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;
        var checkedSize = form.querySelector('input[name="pet-size"]:checked');

        detailsList.innerHTML = '';
        addRow('Owner', document.getElementById('owner-name').value);
        addRow('Pet', document.getElementById('pet-name').value + ' (' + checkedSize.value + ')');
        addRow('Service', serviceText);
        addRow('Date', document.getElementById('appointment-date').value);
        addRow('Time', formatTime12h(timeInput.value));

        form.hidden = true;
        confirmationBox.hidden = false;
        confirmationBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    bookAnotherBtn.addEventListener('click', function () {
        form.reset();
        resetBookingState();
        form.hidden = false;
        confirmationBox.hidden = true;
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    form.addEventListener('reset', function () {
        resetBookingState();
    });
}

// ---------------------------------------------------------
// Contact form: live character counter
// ---------------------------------------------------------
function initContactCharCounter() {
    var textarea = document.getElementById('contact-message');
    var counter = document.getElementById('message-char-count');
    var MAX_LENGTH = 500;

    function updateCount() {
        counter.textContent = textarea.value.length + ' / ' + MAX_LENGTH + ' characters';
    }

    textarea.addEventListener('input', updateCount);
    textarea.form.addEventListener('reset', function () {
        window.setTimeout(updateCount, 0);
    });
    updateCount();
}

// Contact form: show a frontend-only submission confirmation.
function initContactForm() {
    var form = document.querySelector('#contact form');
    var status = document.getElementById('contact-status');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        form.reset();
        status.textContent = 'Thanks for your message. We will get back to you soon.';
    });

    form.addEventListener('reset', function () {
        status.textContent = '';
    });
}
