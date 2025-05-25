// components/items/items.js

let DUMMY_MASTER_ITEMS = [
    { id: 'item_master_1', name: 'Super Widget A (SWA)', hsn: '847100', mrp: 150, buyingPrice: 90, sellingPrice: 120, gstRate: 0.18, currentStock: 50,
        transactions: [
            { date: '2023-10-01', type: 'Purchase', qtyChange: 60, balance: 60, ref: 'P001' },
            { date: '2023-10-15', type: 'Sale', qtyChange: -10, balance: 50, ref: 'S001' },
            { date: '2023-11-05', type: 'Purchase', qtyChange: 20, balance: 70, ref: 'P002' },
            { date: '2023-11-20', type: 'Sale', qtyChange: -20, balance: 50, ref: 'S002' },
        ]},
    { id: 'item_master_2', name: 'Mega Gizmo B (MGB)', hsn: '847101', mrp: 300, buyingPrice: 220, sellingPrice: 275, gstRate: 0.18, currentStock: 30,
        transactions: [ { date: '2023-11-01', type: 'Initial Stock', qtyChange: 30, balance: 30, ref: 'INIT' } ]},
    { id: 'item_master_3', name: 'Basic Unit C (BUC)', hsn: '847102', mrp: 100, buyingPrice: 65, sellingPrice: 85, gstRate: 0.12, currentStock: 0, transactions: [] },
];

let itemScreenCsIdCounter = 0; // CS for Custom Select
// Moved to top-level scope
function getItemScreenUniqueCustomSelectId() {
    return `items-cs-id-${itemScreenCsIdCounter++}`;
}

function itemsModuleInitializer() {
    console.log("Items Module Initializing...");

    const itemListContainer = document.getElementById('item-list-container');
    const itemCardTemplate = document.getElementById('item-card-template');
    const noItemsMessage = document.getElementById('no-items-message');

    const toggleAddItemFormBtn = document.getElementById('toggle-add-item-form-btn');
    const addItemBtnText = document.getElementById('add-item-btn-text');
    const addItemBtnIcon = document.getElementById('add-item-btn-icon');
    const addEditItemFormSection = document.getElementById('add-edit-item-form-section');
    const itemFormTitle = document.getElementById('item-form-title');
    const itemForm = document.getElementById('item-form');
    const itemIdEditInput = document.getElementById('item-id-edit');
    const itemNameInput = document.getElementById('item-form-name');
    const itemHsnInput = document.getElementById('item-form-hsn');
    const itemMrpInput = document.getElementById('item-form-mrp');
    const itemBuyingPriceInput = document.getElementById('item-form-buying-price');
    const itemSellingPriceInput = document.getElementById('item-form-selling-price');

    const itemFormGstSelectButton = document.getElementById('item-form-gst-select-button');
    const itemFormGstSelectOptionsList = document.getElementById('item-form-gst-select-options');
    const itemFormGstSelectValueInput = document.getElementById('item-form-gst-select-value');
    const itemFormGstSelectSelectedText = document.getElementById('item-form-gst-select-selected-text');
    let itemFormGstSelectManager = null;
    const itemsPageActiveCustomSelects = new Set();
    const itemCardMonthFilterManagers = new Map(); // To store managers for each card's month filter

    function formatCurrency(amount) { return `₹${Number(amount || 0).toFixed(2)}`; }

    function setupItemsPageCustomSelect( // Ensure this function name is used consistently
        instanceId, buttonEl, optionsListEl, hiddenInputEl, selectedTextEl,
        itemsData, defaultTextDisplay, defaultValue, onSelectCallback
    ) {
        let currentItems = [...itemsData]; // Local copy of items for this instance
        selectedTextEl.textContent = defaultTextDisplay;
        hiddenInputEl.value = defaultValue;

        const labelEl = buttonEl.closest('div.relative')?.previousElementSibling;
        if(labelEl && labelEl.id) buttonEl.setAttribute('aria-labelledby', `${labelEl.id} ${buttonEl.id || `btn-${instanceId}`}`);
        else buttonEl.setAttribute('aria-labelledby', buttonEl.id || `btn-${instanceId}`);

        const instance = {
            id: instanceId, buttonEl, optionsListEl,
            isOpen: () => !optionsListEl.classList.contains('hidden'),
            close: () => { optionsListEl.classList.add('hidden'); buttonEl.setAttribute('aria-expanded', 'false'); },
            open: () => {
                itemsPageActiveCustomSelects.forEach(cs => { if (cs.id !== instanceId && cs.isOpen()) cs.close(); });
                optionsListEl.classList.remove('hidden'); buttonEl.setAttribute('aria-expanded', 'true');
            }
        };
        itemsPageActiveCustomSelects.add(instance);

        function populateOptions(currentVal) {
            optionsListEl.innerHTML = '';
            currentItems.forEach(item => { // Use currentItems (local copy)
                const li = document.createElement('li');
                li.className = 'text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 group hover:bg-indigo-600 hover:text-white';
                li.id = `itemspage-custom-opt-${instanceId}-${item.id || 'default'}`;
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
                    Array.from(optionsListEl.querySelectorAll('li')).forEach(opt => {
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
        populateOptions(hiddenInputEl.value); // Initial population using default value

        buttonEl.addEventListener('click', (e) => { e.stopPropagation(); instance.isOpen() ? instance.close() : instance.open(); });

        // This is the object returned, ensure 'refresh' is correctly defined
        return {
            getValue: () => hiddenInputEl.value,
            setValue: (valStr) => {
                const selectedItem = currentItems.find(i => String(i.id) === String(valStr));
                if (selectedItem) {
                    selectedTextEl.textContent = selectedItem.name;
                    hiddenInputEl.value = selectedItem.id;
                } else {
                    selectedTextEl.textContent = defaultTextDisplay;
                    hiddenInputEl.value = defaultValue;
                }
                populateOptions(hiddenInputEl.value);
            },
            refresh: (newItemsData, newValueToSet) => {
                currentItems = [...newItemsData]; // Update the internal items for this instance
                const valueToActuallySet = newValueToSet !== undefined ? newValueToSet : (currentItems.some(opt => opt.id === hiddenInputEl.value) ? hiddenInputEl.value : defaultValue);

                const selectedItem = currentItems.find(i => String(i.id) === String(valueToActuallySet));
                if (selectedItem) {
                    selectedTextEl.textContent = selectedItem.name;
                    hiddenInputEl.value = selectedItem.id;
                } else { // Fallback if newValueToSet is not in newItemsData
                    selectedTextEl.textContent = defaultTextDisplay;
                    hiddenInputEl.value = defaultValue;
                }
                populateOptions(hiddenInputEl.value);
            },
            destroy: () => { itemsPageActiveCustomSelects.delete(instance); }
        };
    }

    const itemsPageGlobalClickListener = (e) => {
        itemsPageActiveCustomSelects.forEach(cs => {
            if (cs.buttonEl && !cs.buttonEl.contains(e.target) && cs.optionsListEl && !cs.optionsListEl.contains(e.target) && cs.isOpen()) {
                cs.close();
            }
        });
    };
    document.removeEventListener('click', itemsPageGlobalClickListener);
    document.addEventListener('click', itemsPageGlobalClickListener);


    function setFormMode(mode, item = null) { // mode can be 'add' or 'edit'
        itemForm.reset();
        if (itemFormGstSelectManager) itemFormGstSelectManager.setValue("0.18"); // Default GST

        if (mode === 'edit' && item) {
            itemFormTitle.textContent = "Edit Item";
            addItemBtnText.textContent = "Cancel Edit";
            addItemBtnIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`;
            itemIdEditInput.value = item.id;
            itemNameInput.value = item.name;
            itemHsnInput.value = item.hsn || '';
            itemMrpInput.value = item.mrp || '';
            itemBuyingPriceInput.value = item.buyingPrice;
            itemSellingPriceInput.value = item.sellingPrice;
            if (itemFormGstSelectManager) itemFormGstSelectManager.setValue(String(item.gstRate));
            addEditItemFormSection.classList.add('form-section-visible');
            itemNameInput.focus();
        } else { // 'add' mode or closing
            itemFormTitle.textContent = "Add New Item";
            addItemBtnText.textContent = "Add New Item";
            addItemBtnIcon.innerHTML = `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />`;
            itemIdEditInput.value = "";
            addEditItemFormSection.classList.remove('form-section-visible');
        }
    }

    function handleToggleAddItemForm() {
        const isVisible = addEditItemFormSection.classList.contains('form-section-visible');
        if (isVisible) { // If visible, it means we are cancelling either add or edit
            setFormMode('close');
        } else { // If hidden, we are opening for add
            setFormMode('add');
            addEditItemFormSection.classList.add('form-section-visible'); // Explicitly show
            addItemBtnText.textContent = "Cancel Adding"; // Update button for cancel
            addItemBtnIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`;
        }
    }

    function handleItemFormSubmit(event) {
        event.preventDefault();
        const itemId = itemIdEditInput.value;
        const gstRateString = itemFormGstSelectManager ? itemFormGstSelectManager.getValue() : "0.18";

        const itemData = {
            id: itemId || `item_master_${Date.now()}`,
            name: itemNameInput.value.trim(),
            hsn: itemHsnInput.value.trim(),
            mrp: parseFloat(itemMrpInput.value) || 0,
            buyingPrice: parseFloat(itemBuyingPriceInput.value) || 0,
            sellingPrice: parseFloat(itemSellingPriceInput.value) || 0,
            gstRate: parseFloat(gstRateString),
            currentStock: itemId ? (DUMMY_MASTER_ITEMS.find(i => i.id === itemId)?.currentStock || 0) : 0,
            transactions: itemId ? (DUMMY_MASTER_ITEMS.find(i => i.id === itemId)?.transactions || []) : []
        };

        if (!itemData.name || isNaN(itemData.sellingPrice) || itemData.sellingPrice < 0) {
            alert("Item Name and a valid Selling Price (>= 0) are required."); return;
        }
        if (isNaN(itemData.buyingPrice) || itemData.buyingPrice < 0) {
            alert("Buying Price must be a valid number (>=0)."); return;
        }


        if (itemId) { // Editing
            const index = DUMMY_MASTER_ITEMS.findIndex(i => i.id === itemId);
            if (index > -1) DUMMY_MASTER_ITEMS[index] = itemData;
        } else { // Adding new
            DUMMY_MASTER_ITEMS.push(itemData);
        }
        renderItemList();
        setFormMode('close'); // Close form and reset button
    }

    function renderItemList() {
        if (!itemListContainer || !itemCardTemplate) return;
        itemListContainer.innerHTML = '';
        itemCardMonthFilterManagers.forEach(manager => manager.destroy());
        itemCardMonthFilterManagers.clear();

        if (DUMMY_MASTER_ITEMS.length === 0) {
            if(noItemsMessage) noItemsMessage.classList.remove('hidden');
            return;
        }
        if(noItemsMessage) noItemsMessage.classList.add('hidden');

        DUMMY_MASTER_ITEMS.sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
            const card = itemCardTemplate.cloneNode(true);
            card.id = `item-${item.id}`;
            card.classList.remove('hidden', 'item-card-template');
            card.dataset.itemId = item.id;

            card.querySelector('.item-name').textContent = item.name;
            card.querySelector('.item-stock').textContent = item.currentStock;
            card.querySelector('.item-selling-price').textContent = formatCurrency(item.sellingPrice);

            card.querySelector('.item-hsn').textContent = item.hsn || 'N/A';
            card.querySelector('.item-mrp').textContent = item.mrp ? formatCurrency(item.mrp) : 'N/A';
            card.querySelector('.item-buying-price').textContent = formatCurrency(item.buyingPrice);
            card.querySelector('.item-selling-price-detail').textContent = formatCurrency(item.sellingPrice);
            card.querySelector('.item-gst-rate').textContent = (item.gstRate * 100).toFixed(0);
            card.querySelector('.item-stock-detail').textContent = item.currentStock;

            const deleteBtn = card.querySelector('.delete-item-btn');
            if (item.currentStock !== 0) {
                //deleteBtn.disabled = true;
                deleteBtn.title = "Cannot delete: item has stock.";
                // Add an event listener to show an alert even if disabled (for better UX)
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card header click
                    showToast(`Cannot delete "${item.name}". Stock is not zero.`, 3000, true); // true for error style
                });
            } else {
                deleteBtn.disabled = false;
                deleteBtn.title = "Delete this item.";
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
                        DUMMY_MASTER_ITEMS = DUMMY_MASTER_ITEMS.filter(i => i.id !== item.id);
                        renderItemList(); // Re-render the list after deletion
                    }
                });
            }

            const editBtn = card.querySelector('.edit-item-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                setFormMode('edit', item);
                // Scroll to form if it's off-screen (optional)
                addEditItemFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            const itemDetailsContent = card.querySelector('.item-details-content');
            const expandIcon = card.querySelector('.item-expand-icon');
            const monthFilterButton = card.querySelector('.item-month-filter-button');
            const monthFilterOptionsList = card.querySelector('.item-month-filter-options');
            const monthFilterValueInput = card.querySelector('.item-month-filter-value');
            const monthFilterSelectedText = card.querySelector('.item-month-filter-selected-text');

            if (monthFilterButton && monthFilterOptionsList && monthFilterValueInput && monthFilterSelectedText) {
                const monthFilterManagerId = `month-filter-${item.id}-${getItemScreenUniqueCustomSelectId()}`;
                if(monthFilterButton) monthFilterButton.id = `btn-${monthFilterManagerId}`;

                const monthManager = setupItemsPageCustomSelect( // Ensure correct function name
                    monthFilterManagerId, monthFilterButton, monthFilterOptionsList,
                    monthFilterValueInput, monthFilterSelectedText,
                    [{ id: 'all', name: 'All Months' }], // Initial minimal options
                    'All Months', // Default display text
                    'all',        // Default actual value
                    (selectedValue) => { // onSelectCallback
                        populateTransactions(card, item.id, selectedValue);
                    }
                );
                itemCardMonthFilterManagers.set(card, monthManager); // Store the returned manager object
            }

            card.querySelector('.item-card-header').addEventListener('click', () => {
                const isCurrentlyExpanded = itemDetailsContent.classList.contains('details-section-visible');
                document.querySelectorAll('#item-list-container .item-details-content.details-section-visible').forEach(openDetail => {
                    if (openDetail !== itemDetailsContent) {
                        openDetail.classList.remove('details-section-visible');
                        openDetail.closest('.item-card').querySelector('.item-expand-icon').classList.remove('expanded');
                    }
                });
                itemDetailsContent.classList.toggle('details-section-visible', !isCurrentlyExpanded);
                expandIcon.classList.toggle('expanded', !isCurrentlyExpanded);

                if (!isCurrentlyExpanded) {
                    const monthManager = itemCardMonthFilterManagers.get(card);
                    if (monthManager) { // If manager exists
                        populateMonthFilterOptions(monthManager, item.id); // Populate with actual months
                        // Trigger transaction population with current filter value (which should be 'all' initially)
                        populateTransactions(card, item.id, monthManager.getValue());
                    }
                }
            });

            itemListContainer.appendChild(card);
        });
    }

    function populateMonthFilterOptions(monthSelectManager, itemId) {
        const item = DUMMY_MASTER_ITEMS.find(i => i.id === itemId);
        // Ensure monthSelectManager is the actual manager object and has the refresh method
        if (!item || !item.transactions || item.transactions.length === 0 || !monthSelectManager || typeof monthSelectManager.refresh !== 'function') {
            if (!monthSelectManager || typeof monthSelectManager.refresh !== 'function') {
                console.error("MonthSelectManager is invalid or missing refresh method for item:", itemId, monthSelectManager);
            }
            return;
        }

        const months = new Set();
        item.transactions.forEach(tx => months.add(tx.date.substring(0, 7)));

        const monthOptions = [{ id: 'all', name: 'All Months' }];
        Array.from(months).sort((a,b) => b.localeCompare(a)).forEach(monthYear => {
            const [year, monthNum] = monthYear.split('-');
            const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            monthOptions.push({
                id: monthYear,
                name: dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })
            });
        });

        const currentValue = monthSelectManager.getValue(); // Get current value before refreshing
        // Pass new options and a value to set (current if still valid, else 'all')
        monthSelectManager.refresh(monthOptions, monthOptions.some(opt => opt.id === currentValue) ? currentValue : 'all');
    }

    function populateTransactions(cardElement, itemId, selectedMonth) {
        const item = DUMMY_MASTER_ITEMS.find(i => i.id === itemId);
        const tbody = cardElement.querySelector('.item-transactions-tbody');
        const noTransactionsMsg = cardElement.querySelector('.item-no-transactions-msg');
        if(!tbody || !noTransactionsMsg) return;
        tbody.innerHTML = '';

        if (!item || !item.transactions || item.transactions.length === 0) {
            noTransactionsMsg.classList.remove('hidden'); return;
        }
        const filteredTransactions = selectedMonth === 'all'
            ? item.transactions
            : item.transactions.filter(tx => tx.date.startsWith(selectedMonth));

        if (filteredTransactions.length === 0) {
            noTransactionsMsg.classList.remove('hidden'); return;
        }
        noTransactionsMsg.classList.add('hidden');
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        filteredTransactions.forEach(tx => {
            const row = tbody.insertRow();
            const date = new Date(tx.date + "T00:00:00"); // Ensure date is treated as local for display
            row.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap">${date.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td class="px-4 py-2 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ tx.type === 'Purchase' ? 'bg-green-100 text-green-800' : tx.type === 'Sale' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${tx.type} ${tx.ref ? `(${tx.ref})` : ''}</span></td>
                <td class="px-4 py-2 whitespace-nowrap text-right">${tx.qtyChange > 0 ? '+' : ''}${tx.qtyChange}</td>
                <td class="px-4 py-2 whitespace-nowrap text-right">${tx.balance}</td>`;
        });
    }

    if (toggleAddItemFormBtn) toggleAddItemFormBtn.addEventListener('click', handleToggleAddItemForm);
    if (itemForm) itemForm.addEventListener('submit', handleItemFormSubmit);

    if (itemFormGstSelectButton) {
        const gstRateOptions = [
            { id: "0", name: "0%" }, { id: "0.05", name: "5%" },
            { id: "0.12", name: "12%" }, { id: "0.18", name: "18%" },
            { id: "0.28", name: "28%" }
        ];
        itemFormGstSelectManager = setupItemsPageCustomSelect(
            'item-form-gst-mgr', itemFormGstSelectButton, itemFormGstSelectOptionsList,
            itemFormGstSelectValueInput, itemFormGstSelectSelectedText,
            gstRateOptions, "18%", "0.18", // Default display, default value
            null
        );
    }

    renderItemList(); // Initial render of item list
    setFormMode('close'); // Ensure form is initially closed
    console.log("Items Module Initialized (Corrected).");
}

if (window.registerComponentModule) {
    window.registerComponentModule('items', itemsModuleInitializer);
} else { console.error("`registerComponentModule` not found for Items."); }