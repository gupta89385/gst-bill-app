// components/parties/parties.js

let DUMMY_PARTIES_DATA = {
    buyers: [
        { id: 'b1', name: 'Retail Customer Cash', gstin: '', address: 'N/A', contactName: '', contactPhone: '', contactEmail: '', dateAdded: '2023-01-10', type: 'buyer' },
        { id: 'b2', name: 'Modern Traders', gstin: '27AAPCM1234B1Z5', address: '123 Business St, Mumbai', contactName: 'Ramesh Kumar', contactPhone: '9876543210', contactEmail: 'ramesh@modern.com', dateAdded: '2023-03-15', type: 'buyer' },
    ],
    sellers: [
        { id: 's1', name: 'Global Importers Inc.', gstin: '22GHIJL1234K1Z2', address: '456 Import Ln, Delhi', contactName: 'Sunita Sharma', contactPhone: '9988776655', contactEmail: 'sunita@globalimp.co', dateAdded: '2023-02-20', type: 'seller'},
        { id: 's2', name: 'National Distributors Ltd.', gstin: '19MNOQP5678R1Z9', address: '789 Supply Rd, Bangalore', contactName: 'Amit Patel', contactPhone: '9123456789', contactEmail: 'amit@nationaldist.com', dateAdded: '2023-04-05', type: 'seller'},
    ]
};

let partyScreenCsIdCounter = 0;
function getPartyScreenCsUniqueId() { return `parties-cs-id-${partyScreenCsIdCounter++}`; }

function partiesModuleInitializer() {
    console.log("Parties Module Initializing...");

    const partyListContainer = document.getElementById('party-list-container');
    const partyCardTemplate = document.getElementById('party-card-template');
    const noPartiesMessage = document.getElementById('no-parties-message');

    const toggleAddPartyFormBtn = document.getElementById('toggle-add-party-form-btn');
    const addPartyBtnText = document.getElementById('add-party-btn-text');
    const addPartyBtnIcon = document.getElementById('add-party-btn-icon');
    const addEditPartyFormSection = document.getElementById('add-edit-party-form-section');
    const partyFormTitle = document.getElementById('party-form-title');
    const partyForm = document.getElementById('party-form');
    const partyIdEditInput = document.getElementById('party-id-edit');
    const partyTypeFormInput = document.getElementById('party-type-form'); // Hidden input for type
    const partyNameInput = document.getElementById('party-form-name');
    const partyGstinInput = document.getElementById('party-form-gstin');
    const partyAddressInput = document.getElementById('party-form-address');
    const partyContactNameInput = document.getElementById('party-form-contact-name');
    const partyContactPhoneInput = document.getElementById('party-form-contact-phone');
    const partyContactEmailInput = document.getElementById('party-form-contact-email');

    const tabBuyers = document.getElementById('tab-buyers');
    const tabSellers = document.getElementById('tab-sellers');
    let activeTab = 'buyers'; // Default active tab

    const dateAddedFilterButton = document.getElementById('party-date-added-filter-button');
    const dateAddedFilterOptionsList = document.getElementById('party-date-added-filter-options');
    const dateAddedFilterValueInput = document.getElementById('party-date-added-filter-value');
    const dateAddedFilterSelectedText = document.getElementById('party-date-added-filter-selected-text');
    let dateAddedFilterManager = null;

    const partiesPageActiveCustomSelects = new Set(); // For the date filter dropdown

    function formatCurrency(amount) { return `₹${Number(amount || 0).toFixed(2)}`; } // Not used here but good to have

    // --- Custom Select for Date Added Filter (reusing the setup function) ---
    function setupPartiesPageCustomSelect( /* ... Same as in items.js, adapted slightly ... */
                                           instanceId, buttonEl, optionsListEl, hiddenInputEl, selectedTextEl,
                                           items, defaultTextDisplay, defaultValue, onSelectCallback
    ) {
        selectedTextEl.textContent = defaultTextDisplay;
        hiddenInputEl.value = defaultValue;
        // aria-labelledby setup
        const labelEl = buttonEl.closest('div.relative')?.previousElementSibling; // Check if label exists
        if(labelEl && labelEl.id) buttonEl.setAttribute('aria-labelledby', `${labelEl.id} ${buttonEl.id || `btn-${instanceId}`}`);
        else buttonEl.setAttribute('aria-labelledby', buttonEl.id || `btn-${instanceId}`);


        const instance = {
            id: instanceId, buttonEl, optionsListEl,
            isOpen: () => !optionsListEl.classList.contains('hidden'),
            close: () => { optionsListEl.classList.add('hidden'); buttonEl.setAttribute('aria-expanded', 'false'); },
            open: () => {
                partiesPageActiveCustomSelects.forEach(cs => { if (cs.id !== instanceId && cs.isOpen()) cs.close(); });
                optionsListEl.classList.remove('hidden'); buttonEl.setAttribute('aria-expanded', 'true');
            }
        };
        partiesPageActiveCustomSelects.add(instance);

        function populateOptions(currentVal) {
            optionsListEl.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 group hover:bg-indigo-600 hover:text-white';
                li.id = `partiespage-custom-opt-${instanceId}-${item.id || 'default'}`;
                li.setAttribute('role', 'option'); li.dataset.value = item.id;
                const div = document.createElement('div'); div.className = 'flex items-center';
                const nameSpan = document.createElement('span'); nameSpan.className = 'font-normal block truncate group-hover:font-semibold';
                nameSpan.textContent = item.name; div.appendChild(nameSpan); li.appendChild(div);
                const checkmarkSpan = document.createElement('span');
                checkmarkSpan.className = 'text-indigo-600 absolute inset-y-0 right-0 flex items-center pr-4 hidden group-hover:text-white';
                checkmarkSpan.innerHTML = `<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
                li.appendChild(checkmarkSpan);

                if (String(currentVal) === String(item.id)) {
                    li.classList.add('bg-indigo-50'); nameSpan.classList.replace('font-normal', 'font-semibold');
                    checkmarkSpan.classList.remove('hidden');
                }
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedTextEl.textContent = item.name; hiddenInputEl.value = item.id; instance.close();
                    Array.from(optionsListEl.querySelectorAll('li')).forEach(opt => { /* deselect visual */
                        opt.classList.remove('bg-indigo-50');
                        opt.querySelector('span.font-semibold')?.classList.replace('font-semibold', 'font-normal');
                        opt.querySelector('span.absolute svg')?.parentElement.classList.add('hidden');
                    });
                    li.classList.add('bg-indigo-50'); nameSpan.classList.replace('font-normal', 'font-semibold');
                    checkmarkSpan.classList.remove('hidden');
                    if (onSelectCallback) onSelectCallback(item.id);
                });
                optionsListEl.appendChild(li);
            });
        }
        populateOptions(hiddenInputEl.value); // Initial population
        buttonEl.addEventListener('click', (e) => { e.stopPropagation(); instance.isOpen() ? instance.close() : instance.open(); });
        return { // Return object with methods
            getValue: () => hiddenInputEl.value,
            setValue: (valStr) => { /* ... same as items.js ... */
                const selectedItem = items.find(i => String(i.id) === String(valStr));
                if (selectedItem) {
                    selectedTextEl.textContent = selectedItem.name; hiddenInputEl.value = selectedItem.id;
                } else {
                    selectedTextEl.textContent = defaultTextDisplay; hiddenInputEl.value = defaultValue;
                }
                populateOptions(hiddenInputEl.value);
            },
            refresh: (newItems, newValueToSet) => { /* ... same as items.js ... */
                items = [...newItems]; // Make sure `items` here refers to the closure variable
                const valueToActuallySet = newValueToSet !== undefined ? newValueToSet : (items.some(opt => opt.id === hiddenInputEl.value) ? hiddenInputEl.value : defaultValue);
                const selItem = items.find(i => String(i.id) === String(valueToActuallySet));
                if (selItem) {
                    selectedTextEl.textContent = selItem.name; hiddenInputEl.value = selItem.id;
                } else {
                    selectedTextEl.textContent = defaultTextDisplay; hiddenInputEl.value = defaultValue;
                }
                populateOptions(hiddenInputEl.value);
            },
            destroy: () => { partiesPageActiveCustomSelects.delete(instance); }
        };
    }
    const partiesPageGlobalClickListener = (e) => {
        partiesPageActiveCustomSelects.forEach(cs => {
            if (cs.buttonEl && !cs.buttonEl.contains(e.target) && cs.optionsListEl && !cs.optionsListEl.contains(e.target) && cs.isOpen()) {
                cs.close();
            }
        });
    };
    document.removeEventListener('click', partiesPageGlobalClickListener);
    document.addEventListener('click', partiesPageGlobalClickListener);


    // --- Form Management ---
    function setPartyFormMode(mode, party = null) {
        partyForm.reset();
        partyTypeFormInput.value = activeTab; // Set based on current tab

        if (mode === 'edit' && party) {
            partyFormTitle.textContent = `Edit ${party.type === 'buyers' ? 'Buyer' : 'Seller'}`;
            addPartyBtnText.textContent = "Cancel Edit";
            addPartyBtnIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`;
            partyIdEditInput.value = party.id;
            partyTypeFormInput.value = party.type; // Preserve original type on edit
            partyNameInput.value = party.name;
            partyGstinInput.value = party.gstin || '';
            partyAddressInput.value = party.address || '';
            partyContactNameInput.value = party.contactName || '';
            partyContactPhoneInput.value = party.contactPhone || '';
            partyContactEmailInput.value = party.contactEmail || '';
            addEditPartyFormSection.classList.add('form-section-visible');
            partyNameInput.focus();
        } else { // 'add' or 'close'
            partyFormTitle.textContent = `Add New ${activeTab === 'buyers' ? 'Buyer' : 'Seller'}`;
            addPartyBtnText.textContent = "Add New Party";
            addPartyBtnIcon.innerHTML = `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />`;
            partyIdEditInput.value = "";
            addEditPartyFormSection.classList.remove('form-section-visible');
        }
    }

    function handleToggleAddPartyForm() {
        const isVisible = addEditPartyFormSection.classList.contains('form-section-visible');
        if (isVisible) { setFormMode('close'); }
        else {
            setFormMode('add');
            addEditPartyFormSection.classList.add('form-section-visible');
            addPartyBtnText.textContent = `Cancel Adding ${activeTab === 'buyers' ? 'Buyer' : 'Seller'}`;
            addPartyBtnIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`;
        }
    }

    function handlePartyFormSubmit(event) {
        event.preventDefault();
        const partyId = partyIdEditInput.value;
        const partyType = partyTypeFormInput.value; // 'buyers' or 'sellers'

        const partyData = {
            id: partyId || `${partyType.slice(0,1)}_${Date.now()}`,
            name: partyNameInput.value.trim(),
            gstin: partyGstinInput.value.trim(),
            address: partyAddressInput.value.trim(),
            contactName: partyContactNameInput.value.trim(),
            contactPhone: partyContactPhoneInput.value.trim(),
            contactEmail: partyContactEmailInput.value.trim(),
            dateAdded: partyId ? DUMMY_PARTIES_DATA[partyType].find(p=>p.id === partyId).dateAdded : new Date().toISOString().slice(0,10),
            type: partyType // Store type for easier filtering if needed later
        };

        if (!partyData.name) { showToast("Party Name is required.", 3000, true); return; }

        if (partyId) { // Editing
            const index = DUMMY_PARTIES_DATA[partyType].findIndex(p => p.id === partyId);
            if (index > -1) DUMMY_PARTIES_DATA[partyType][index] = partyData;
            showToast("Party updated successfully.", 3000, false);
        } else { // Adding new
            DUMMY_PARTIES_DATA[partyType].push(partyData);
            showToast("Party added successfully.", 3000, false);
        }
        renderPartyList();
        populateDateAddedFilterOptions(); // Refresh filter options
        setFormMode('close');
    }


    // --- Tab Management ---
    function setActiveTab(tabName) {
        activeTab = tabName;
        if (tabBuyers && tabSellers) {
            tabBuyers.classList.toggle('active-tab', activeTab === 'buyers');
            tabBuyers.classList.toggle('border-indigo-500', activeTab === 'buyers');
            tabBuyers.classList.toggle('text-indigo-600', activeTab === 'buyers');
            tabBuyers.classList.toggle('border-transparent', activeTab !== 'buyers');
            tabBuyers.classList.toggle('text-gray-500', activeTab !== 'buyers');
            tabBuyers.setAttribute('aria-current', activeTab === 'buyers' ? 'page' : 'false');

            tabSellers.classList.toggle('active-tab', activeTab === 'sellers');
            tabSellers.classList.toggle('border-indigo-500', activeTab === 'sellers');
            tabSellers.classList.toggle('text-indigo-600', activeTab === 'sellers');
            tabSellers.classList.toggle('border-transparent', activeTab !== 'sellers');
            tabSellers.classList.toggle('text-gray-500', activeTab !== 'sellers');
            tabSellers.setAttribute('aria-current', activeTab === 'sellers' ? 'page' : 'false');
        }
        partyFormTitle.textContent = `Add New ${activeTab === 'buyers' ? 'Buyer' : 'Seller'}`; // Update form title hint
        partyTypeFormInput.value = activeTab;
        renderPartyList();
        populateDateAddedFilterOptions(); // Dates might differ per tab
        if (dateAddedFilterManager) dateAddedFilterManager.setValue("all"); // Reset filter on tab change
    }

    // --- List Rendering ---
    function renderPartyList() {
        if (!partyListContainer || !partyCardTemplate) return;
        partyListContainer.innerHTML = '';

        const selectedDateFilter = dateAddedFilterManager ? dateAddedFilterManager.getValue() : 'all';
        const partiesToRender = DUMMY_PARTIES_DATA[activeTab].filter(party => {
            if (selectedDateFilter === 'all') return true;
            return party.dateAdded.startsWith(selectedDateFilter); // YYYY-MM match
        }).sort((a,b) => a.name.localeCompare(b.name));

        if (partiesToRender.length === 0) {
            if(noPartiesMessage) noPartiesMessage.classList.remove('hidden');
            return;
        }
        if(noPartiesMessage) noPartiesMessage.classList.add('hidden');

        partiesToRender.forEach(party => {
            const card = partyCardTemplate.cloneNode(true);
            card.id = `party-${party.id}`;
            card.classList.remove('hidden', 'party-card-template');
            card.dataset.partyId = party.id;
            card.dataset.partyType = activeTab;

            card.querySelector('.party-name').textContent = party.name;
            card.querySelector('.party-gstin-summary').textContent = party.gstin || 'N/A';
            const dateAdded = new Date(party.dateAdded + "T00:00:00");
            card.querySelector('.party-date-added').textContent = dateAdded.toLocaleDateString();

            // Details
            card.querySelector('.party-gstin-detail').textContent = party.gstin || 'N/A';
            card.querySelector('.party-address').textContent = party.address || 'N/A';
            card.querySelector('.party-contact-name').textContent = party.contactName || 'N/A';
            card.querySelector('.party-contact-phone').textContent = party.contactPhone || 'N/A';
            card.querySelector('.party-contact-email').textContent = party.contactEmail || 'N/A';
            card.querySelector('.party-date-added-detail').textContent = dateAdded.toLocaleDateString();


            const deleteBtn = card.querySelector('.delete-party-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Add validation later if party has transactions
                if (confirm(`Are you sure you want to delete "${party.name}"?`)) {
                    DUMMY_PARTIES_DATA[activeTab] = DUMMY_PARTIES_DATA[activeTab].filter(p => p.id !== party.id);
                    renderPartyList();
                    populateDateAddedFilterOptions();
                    showToast(`Party "${party.name}" deleted.`, 3000, false);
                }
            });

            const editBtn = card.querySelector('.edit-party-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                setPartyFormMode('edit', party);
                addEditPartyFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            const partyDetailsContent = card.querySelector('.party-details-content');
            const expandIcon = card.querySelector('.party-expand-icon');
            card.querySelector('.party-card-header').addEventListener('click', () => {
                const isCurrentlyExpanded = partyDetailsContent.classList.contains('details-section-visible');
                document.querySelectorAll('#party-list-container .party-details-content.details-section-visible').forEach(openDetail => {
                    if (openDetail !== partyDetailsContent) {
                        openDetail.classList.remove('details-section-visible');
                        openDetail.closest('.party-card').querySelector('.party-expand-icon').classList.remove('expanded');
                    }
                });
                partyDetailsContent.classList.toggle('details-section-visible', !isCurrentlyExpanded);
                expandIcon.classList.toggle('expanded', !isCurrentlyExpanded);
            });
            partyListContainer.appendChild(card);
        });
    }

    function populateDateAddedFilterOptions() {
        if (!dateAddedFilterManager) return;
        const relevantParties = DUMMY_PARTIES_DATA[activeTab] || [];
        const months = new Set();
        relevantParties.forEach(party => months.add(party.dateAdded.substring(0, 7))); // YYYY-MM

        const monthOptions = [{ id: 'all', name: 'All Dates Added' }];
        Array.from(months).sort((a,b) => b.localeCompare(a)).forEach(monthYear => {
            const [year, monthNum] = monthYear.split('-');
            const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            monthOptions.push({
                id: monthYear,
                name: dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })
            });
        });

        const currentValue = dateAddedFilterManager.getValue();
        dateAddedFilterManager.refresh(monthOptions, monthOptions.some(opt => opt.id === currentValue) ? currentValue : 'all');
    }

    // --- Event Listeners ---
    if (toggleAddPartyFormBtn) toggleAddPartyFormBtn.addEventListener('click', handleToggleAddPartyForm);
    if (partyForm) partyForm.addEventListener('submit', handlePartyFormSubmit);
    if (tabBuyers) tabBuyers.addEventListener('click', () => setActiveTab('buyers'));
    if (tabSellers) tabSellers.addEventListener('click', () => setActiveTab('sellers'));

    // --- Initial Setup ---
    if (dateAddedFilterButton) {
        dateAddedFilterManager = setupPartiesPageCustomSelect(
            'party-date-added-filter-mgr', dateAddedFilterButton, dateAddedFilterOptionsList,
            dateAddedFilterValueInput, dateAddedFilterSelectedText,
            [{id: 'all', name: 'All Dates Added'}], // Initial minimal
            'All Dates Added', 'all',
            () => renderPartyList() // onSelect: re-render list
        );
    }

    setActiveTab('buyers'); // Default to buyers tab
    setFormMode('close');   // Ensure form is initially closed
    console.log("Parties Module Initialized.");
}

if (window.registerComponentModule) {
    window.registerComponentModule('parties', partiesModuleInitializer);
} else { console.error("`registerComponentModule` not found for Parties."); }