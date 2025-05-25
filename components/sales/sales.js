// components/sales/sales.js

const DUMMY_BUYERS_SOURCE = [
    { id: 'b1', name: 'Retail Customer Cash', gstin: '', address: '' },
    { id: 'b2', name: 'Modern Traders', gstin: '27AAPCM1234B1Z5', address: '123 Business St, Mumbai' },
    { id: 'b3', name: 'Alpha Wholesale', gstin: '29ABCDE1234F1Z5', address: '456 Market Rd, Bangalore' },
];
const DUMMY_ITEMS_SOURCE = [ // Added gstRate
    { id: 'i1', name: 'Super Widget A (SWA)', price: 100.00, stock: 50, gstRate: 0.18 },
    { id: 'i2', name: 'Mega Gizmo B (MGB)', price: 250.50, stock: 30, gstRate: 0.18 },
    { id: 'i3', name: 'Basic Unit C (BUC)', price: 75.00, stock: 100, gstRate: 0.12 },
    { id: 'i4', name: 'Premium Service Pack (PSP)', price: 500.00, stock: 999, gstRate: 0.05 },
];

let salesCustomSelectIdCounter = 0;
function getSalesUniqueCustomSelectId() {
    return `sales-cs-instance-${salesCustomSelectIdCounter++}`;
}

function salesModuleInitializer() {
    console.log("Sales Module Initializing...");

    let currentBuyers = JSON.parse(JSON.stringify(DUMMY_BUYERS_SOURCE));
    let currentItems = JSON.parse(JSON.stringify(DUMMY_ITEMS_SOURCE));

    let buyerSelectManager = null;
    const salesActiveCustomSelects = new Set();
    const salesItemSelectManagers = new Map();

    const salesScreen = document.getElementById('sales-screen');
    if (!salesScreen) { console.warn("Sales screen HTML not found."); return; }

    const buyerCustomSelectButton = document.getElementById('buyer-custom-select-button');
    const buyerCustomSelectOptionsList = document.getElementById('buyer-custom-select-options');
    const buyerSelectValueInput = document.getElementById('buyer-select-value');
    const buyerCustomSelectSelectedText = document.getElementById('buyer-custom-select-selected-text');
    const newBuyerForm = document.getElementById('new-buyer-form');
    const newBuyerNameInput = document.getElementById('new-buyer-name');
    const newBuyerGstinInput = document.getElementById('new-buyer-gstin');
    const newBuyerAddressInput = document.getElementById('new-buyer-address');
    const saveNewBuyerBtn = document.getElementById('save-new-buyer-btn');
    const cancelNewBuyerBtn = document.getElementById('cancel-new-buyer-btn');
    const invoiceDateInput = document.getElementById('invoice-date');

    const itemRowsContainer = document.getElementById('item-rows-container');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemRowTemplate = document.querySelector('.item-row-template');

    const subtotalAmountEl = document.getElementById('subtotal-amount');
    const gstAmountEl = document.getElementById('gst-amount');
    const grandTotalAmountEl = document.getElementById('grand-total-amount');
    const clearSaleBtn = document.getElementById('clear-sale-btn');
    const saveSaleBtn = document.getElementById('save-sale-btn');

    const successPopup = document.getElementById('success-popup');
    const successPopupContent = document.getElementById('success-popup-content');
    const closePopupBtn = document.getElementById('close-popup-btn');

    function formatCurrency(amount) { return `₹${amount.toFixed(2)}`; }

    function setupSalesCustomSelect(
        instanceId, buttonEl, optionsListEl, hiddenInputEl, selectedTextEl,
        items, defaultText, onSelectCallback
    ) {
        selectedTextEl.textContent = defaultText;
        hiddenInputEl.value = "";
        const labelEl = buttonEl.closest('div.relative')?.previousElementSibling;
        if (labelEl && labelEl.id) buttonEl.setAttribute('aria-labelledby', `${labelEl.id} ${buttonEl.id}`);
        else buttonEl.setAttribute('aria-labelledby', buttonEl.id || `btn-${instanceId}`);

        const instance = {
            id: instanceId, buttonEl, optionsListEl,
            isOpen: () => !optionsListEl.classList.contains('hidden'),
            close: () => { optionsListEl.classList.add('hidden'); buttonEl.setAttribute('aria-expanded', 'false'); },
            open: () => {
                salesActiveCustomSelects.forEach(cs => { if (cs.id !== instanceId && cs.isOpen()) cs.close(); });
                optionsListEl.classList.remove('hidden'); buttonEl.setAttribute('aria-expanded', 'true');
            }
        };
        salesActiveCustomSelects.add(instance);

        function populateOptions(currentVal) {
            optionsListEl.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 group hover:bg-indigo-600 hover:text-white';
                li.id = `sales-custom-opt-${instanceId}-${item.id || 'default'}`;
                li.setAttribute('role', 'option'); li.dataset.value = item.id;
                const div = document.createElement('div'); div.className = 'flex items-center';
                const nameSpan = document.createElement('span'); nameSpan.className = 'font-normal block truncate group-hover:font-semibold';
                nameSpan.textContent = item.name; div.appendChild(nameSpan); li.appendChild(div);
                const checkmarkSpan = document.createElement('span');
                checkmarkSpan.className = 'text-indigo-600 absolute inset-y-0 right-0 flex items-center pr-4 hidden group-hover:text-white';
                checkmarkSpan.innerHTML = `<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
                li.appendChild(checkmarkSpan);
                if (currentVal === item.id) {
                    li.classList.add('bg-indigo-50'); nameSpan.classList.replace('font-normal', 'font-semibold');
                    checkmarkSpan.classList.remove('hidden');
                }
                li.addEventListener('click', () => {
                    selectedTextEl.textContent = item.name; hiddenInputEl.value = item.id; instance.close();
                    Array.from(optionsListEl.querySelectorAll('li')).forEach(opt => {
                        opt.classList.remove('bg-indigo-50');
                        opt.querySelector('span.font-semibold')?.classList.replace('font-semibold', 'font-normal');
                        opt.querySelector('span.absolute svg')?.parentElement.classList.add('hidden');
                    });
                    li.classList.add('bg-indigo-50'); nameSpan.classList.replace('font-normal', 'font-semibold');
                    checkmarkSpan.classList.remove('hidden');
                    if (onSelectCallback) onSelectCallback(item.id, buttonEl.closest('.item-row'));
                });
                optionsListEl.appendChild(li);
            });
        }
        populateOptions(hiddenInputEl.value);
        buttonEl.addEventListener('click', (e) => { e.stopPropagation(); instance.isOpen() ? instance.close() : instance.open(); });
        return {
            refresh: (newItems, newValue) => {
                items = newItems; hiddenInputEl.value = newValue || "";
                const selItem = items.find(i => i.id === hiddenInputEl.value);
                selectedTextEl.textContent = selItem ? selItem.name : defaultText;
                populateOptions(hiddenInputEl.value);
            },
            destroy: () => { salesActiveCustomSelects.delete(instance); },
            getValue: () => hiddenInputEl.value,
            setValue: (val) => {
                const selectedItem = items.find(i => i.id === val);
                if (selectedItem) {
                    selectedTextEl.textContent = selectedItem.name; hiddenInputEl.value = val; populateOptions(val);
                    if (onSelectCallback) onSelectCallback(val, buttonEl.closest('.item-row'));
                } else {
                    selectedTextEl.textContent = defaultText; hiddenInputEl.value = ""; populateOptions("");
                }
            }
        };
    }

    const salesGlobalClickListener = (e) => {
        salesActiveCustomSelects.forEach(cs => {
            if (cs.buttonEl && !cs.buttonEl.contains(e.target) && cs.optionsListEl && !cs.optionsListEl.contains(e.target) && cs.isOpen()) {
                cs.close();
            }
        });
    };
    document.removeEventListener('click', salesGlobalClickListener);
    document.addEventListener('click', salesGlobalClickListener);

    function handleBuyerCustomSelect(selectedValue) {
        if (newBuyerForm) {
            if (selectedValue === 'new_buyer') {
                newBuyerForm.classList.add('slide-down'); // From sales.css
                if(newBuyerNameInput) newBuyerNameInput.focus();
            } else {
                newBuyerForm.classList.remove('slide-down');
            }
        }
    }
    function saveNewBuyer() {
        const name = newBuyerNameInput.value.trim();
        if (!name) { alert('Buyer name is required.'); return; }
        const newBuyerId = `b_dyn_${Date.now()}`;
        currentBuyers.push({ id: newBuyerId, name, gstin: newBuyerGstinInput.value.trim(), address: newBuyerAddressInput.value.trim() });
        const buyerOptions = [
            { id: "", name: "-- Select Buyer --" },
            ...currentBuyers.map(b => ({ id: b.id, name: `${b.name} ${b.gstin ? '('+b.gstin+')' : ''}` })),
            { id: "new_buyer", name: "-- Add New Buyer --" }
        ];
        if(buyerSelectManager) buyerSelectManager.refresh(buyerOptions, newBuyerId);
        if(newBuyerForm) newBuyerForm.classList.remove('slide-down');
        if(newBuyerNameInput) newBuyerNameInput.value = '';
        if(newBuyerGstinInput) newBuyerGstinInput.value = '';
        if(newBuyerAddressInput) newBuyerAddressInput.value = '';
        alert('New buyer added!');
    }
    function cancelNewBuyer() {
        if(newBuyerForm) newBuyerForm.classList.remove('slide-down');
        if(newBuyerNameInput) newBuyerNameInput.value = '';
        if(newBuyerGstinInput) newBuyerGstinInput.value = '';
        if(newBuyerAddressInput) newBuyerAddressInput.value = '';
    }

    function handleSaleItemCustomSelect(itemId, itemRowElement) {
        if (!itemRowElement) return;
        const selectedItemData = currentItems.find(i => i.id === itemId);
        const priceInput = itemRowElement.querySelector('.item-price');
        const itemGstRateHiddenInput = itemRowElement.querySelector('.item-gst-rate-hidden');

        if (selectedItemData) {
            if(priceInput) priceInput.value = parseFloat(selectedItemData.price || 0).toFixed(2);
            if(itemGstRateHiddenInput) itemGstRateHiddenInput.value = selectedItemData.gstRate || 0;
        } else {
            if(priceInput) priceInput.value = '';
            if(itemGstRateHiddenInput) itemGstRateHiddenInput.value = 0;
        }
        updateSaleLineTotal(itemRowElement);
    }

    function addSaleItemRow() {
        if (!itemRowTemplate) { console.error("Sales item row template missing!"); return; }
        const newRow = itemRowTemplate.cloneNode(true);
        newRow.classList.remove('item-row-template', 'hidden');

        const itemButtonEl = newRow.querySelector('.item-custom-select-button');
        const itemOptionsListEl = newRow.querySelector('.item-custom-select-options');
        const itemHiddenInputEl = newRow.querySelector('.item-select-value');
        const itemSelectedTextEl = newRow.querySelector('.item-custom-select-selected-text');
        const itemLabel = newRow.querySelector('.item-custom-select-label');

        const uniqueRowIdSuffix = getSalesUniqueCustomSelectId();
        if (itemButtonEl) itemButtonEl.id = `s-item-btn-${uniqueRowIdSuffix}`;
        if (itemOptionsListEl) itemOptionsListEl.id = `s-item-opts-${uniqueRowIdSuffix}`;
        if (itemLabel) itemLabel.id = `s-item-lbl-${uniqueRowIdSuffix}`;

        const itemOptions = [
            { id: "", name: "-- Select Item --"},
            ...currentItems.map(item => ({ id: item.id, name: `${item.name} (Stock: ${item.stock})` }))
        ];
        if (itemButtonEl && itemOptionsListEl && itemHiddenInputEl && itemSelectedTextEl) {
            const manager = setupSalesCustomSelect(
                `s-item-mgr-${uniqueRowIdSuffix}`, itemButtonEl, itemOptionsListEl, itemHiddenInputEl, itemSelectedTextEl,
                itemOptions, "-- Select Item --", handleSaleItemCustomSelect
            );
            salesItemSelectManagers.set(newRow, manager);
        }

        const qtyInput = newRow.querySelector('.item-quantity');
        if(qtyInput) qtyInput.value = '1';
        const priceInput = newRow.querySelector('.item-price');
        if(priceInput) priceInput.value = '';
        const gstRateHidden = newRow.querySelector('.item-gst-rate-hidden');
        if(gstRateHidden) gstRateHidden.value = '0';
        const gstAmountEl = newRow.querySelector('.item-gst-amount');
        if(gstAmountEl) gstAmountEl.value = formatCurrency(0);
        const taxableValueEl = newRow.querySelector('.item-taxable-value');
        if(taxableValueEl) taxableValueEl.value = formatCurrency(0);


        itemRowsContainer.appendChild(newRow);
        if (itemButtonEl) itemButtonEl.focus();
        calculateOverallSaleTotals();
    }

    function handleSaleItemRowChange(event) {
        const target = event.target;
        const itemRow = target.closest('.item-row:not(.item-row-template)');
        if (!itemRow) return;
        if (target.classList.contains('item-quantity')) {
            if (parseInt(target.value) < 1 && target.value !== "") target.value = 1;
            updateSaleLineTotal(itemRow);
        }
    }
    function handleSaleItemRowClick(event) {
        const removeButton = event.target.closest('.remove-item-btn');
        if (removeButton) {
            const itemRow = removeButton.closest('.item-row:not(.item-row-template)');
            if (!itemRow) return;
            if (itemRowsContainer.querySelectorAll('.item-row:not(.item-row-template)').length > 1) {
                const manager = salesItemSelectManagers.get(itemRow);
                if (manager) { manager.destroy(); salesItemSelectManagers.delete(itemRow); }
                itemRow.remove();
                calculateOverallSaleTotals();
            } else { alert("Cannot remove the last item."); }
        }
    }
    function updateSaleLineTotal(itemRow) {
        const quantity = parseFloat(itemRow.querySelector('.item-quantity')?.value) || 0;
        const price = parseFloat(itemRow.querySelector('.item-price')?.value) || 0;
        const itemGstRate = parseFloat(itemRow.querySelector('.item-gst-rate-hidden')?.value) || 0;

        const taxableValue = quantity * price;
        const gstAmountForItem = taxableValue * itemGstRate;

        const taxableValueEl = itemRow.querySelector('.item-taxable-value');
        if (taxableValueEl) taxableValueEl.value = formatCurrency(taxableValue);
        const gstAmountEl = itemRow.querySelector('.item-gst-amount');
        if (gstAmountEl) gstAmountEl.value = formatCurrency(gstAmountForItem);

        calculateOverallSaleTotals();
    }
    function calculateOverallSaleTotals() {
        let totalTaxableValue = 0;
        let totalGstAmount = 0;
        itemRowsContainer.querySelectorAll('.item-row:not(.item-row-template)').forEach(row => {
            const taxableValStr = row.querySelector('.item-taxable-value')?.value.replace(/[^\d.-]/g, '');
            const gstAmtStr = row.querySelector('.item-gst-amount')?.value.replace(/[^\d.-]/g, '');
            totalTaxableValue += parseFloat(taxableValStr) || 0;
            totalGstAmount += parseFloat(gstAmtStr) || 0;
        });
        const grandTotal = totalTaxableValue + totalGstAmount;

        if(subtotalAmountEl) subtotalAmountEl.textContent = formatCurrency(totalTaxableValue);
        if(gstAmountEl) gstAmountEl.textContent = formatCurrency(totalGstAmount);
        if(grandTotalAmountEl) grandTotalAmountEl.textContent = formatCurrency(grandTotal);
    }

    function handleSaveSale() {
        const buyerId = buyerSelectManager ? buyerSelectManager.getValue() : '';
        if (!buyerId || buyerId === 'new_buyer') { alert('Please select or add a buyer.'); return; }
        const items = []; let hasValidItem = false;
        itemRowsContainer.querySelectorAll('.item-row:not(.item-row-template)').forEach(row => {
            const itemManager = salesItemSelectManagers.get(row);
            const itemId = itemManager ? itemManager.getValue() : '';
            const quantityInput = row.querySelector('.item-quantity');
            const priceInput = row.querySelector('.item-price'); // Selling price
            const itemGstRate = parseFloat(row.querySelector('.item-gst-rate-hidden')?.value) || 0;

            if(itemId && quantityInput && priceInput) {
                const quantity = parseInt(quantityInput.value);
                const price = parseFloat(priceInput.value);
                if (quantity > 0 && price >= 0) { // Price can be 0 for free items
                    items.push({ itemId, quantity, price, itemGstRate }); // Store itemGstRate with item
                    hasValidItem = true;
                }
            }
        });
        if (!hasValidItem) { alert('Add at least one valid item.'); return; }
        const saleData = {
            buyerId, items,
            invoiceDate: invoiceDateInput ? invoiceDateInput.value : new Date().toISOString().slice(0,10),
            totalTaxableValue: parseFloat(subtotalAmountEl.textContent.replace(/[^\d.-]/g, '')),
            totalGstAmount: parseFloat(gstAmountEl.textContent.replace(/[^\d.-]/g, '')),
            grandTotal: parseFloat(grandTotalAmountEl.textContent.replace(/[^\d.-]/g, ''))
        };
        console.log("Sale to save:", saleData);
        showSuccessSalePopup();
    }
    function showSuccessSalePopup() {
        if (!successPopup || !successPopupContent) { console.error("Sale Popup elements missing"); return; }
        successPopup.classList.remove('hidden');
        void successPopup.offsetWidth;
        setTimeout(() => {
            successPopup.classList.add('fade-in'); // From sales.css or global animations.css
            successPopupContent.classList.remove('opacity-0', 'scale-95');
            successPopupContent.classList.add('opacity-100', 'scale-100');
        }, 10);
    }
    function closeSuccessSalePopup() {
        if (!successPopup || !successPopupContent) return;
        successPopup.classList.remove('fade-in');
        successPopupContent.classList.remove('opacity-100', 'scale-100');
        successPopupContent.classList.add('opacity-0', 'scale-95');
        setTimeout(() => { successPopup.classList.add('hidden'); }, 300);
    }
    function clearSaleForm() {
        if (buyerSelectManager) {
            const buyerOptions = [
                { id: "", name: "-- Select Buyer --" },
                ...currentBuyers.map(b => ({ id: b.id, name: `${b.name} ${b.gstin ? '('+b.gstin+')' : ''}` })),
                { id: "new_buyer", name: "-- Add New Buyer --" }
            ];
            buyerSelectManager.refresh(buyerOptions, "");
        }
        cancelNewBuyer();
        if (invoiceDateInput) invoiceDateInput.valueAsDate = new Date();
        itemRowsContainer.querySelectorAll('.item-row:not(.item-row-template)').forEach(row => {
            const m = salesItemSelectManagers.get(row); if(m) m.destroy(); row.remove();
        });
        salesItemSelectManagers.clear();
        addSaleItemRow();
        calculateOverallSaleTotals();
        if (buyerCustomSelectButton) buyerCustomSelectButton.focus();
    }

    if (saveNewBuyerBtn) saveNewBuyerBtn.addEventListener('click', saveNewBuyer);
    if (cancelNewBuyerBtn) cancelNewBuyerBtn.addEventListener('click', cancelNewBuyer);
    if (addItemBtn) addItemBtn.addEventListener('click', addSaleItemRow);
    if (saveSaleBtn) saveSaleBtn.addEventListener('click', handleSaveSale);
    if (clearSaleBtn) clearSaleBtn.addEventListener('click', clearSaleForm);
    if (closePopupBtn) closePopupBtn.addEventListener('click', closeSuccessSalePopup);
    if (itemRowsContainer) {
        itemRowsContainer.addEventListener('change', handleSaleItemRowChange);
        itemRowsContainer.addEventListener('click', handleSaleItemRowClick);
    }

    if (invoiceDateInput && !invoiceDateInput.value) invoiceDateInput.valueAsDate = new Date();
    if (buyerCustomSelectButton) {
        const buyerOptions = [
            { id: "", name: "-- Select Buyer --" },
            ...currentBuyers.map(b => ({ id: b.id, name: `${b.name} ${b.gstin ? '('+b.gstin+')' : ''}` })),
            { id: "new_buyer", name: "-- Add New Buyer --" }
        ];
        buyerSelectManager = setupSalesCustomSelect(
            'buyer-main-select', buyerCustomSelectButton, buyerCustomSelectOptionsList,
            buyerSelectValueInput, buyerCustomSelectSelectedText, buyerOptions,
            "-- Select Buyer --", handleBuyerCustomSelect
        );
    }
    if (itemRowsContainer.querySelectorAll('.item-row:not(.item-row-template)').length === 0) {
        addSaleItemRow();
    }
    calculateOverallSaleTotals();
    console.log("Sales Module Initialized.");
}

if (window.registerComponentModule) {
    window.registerComponentModule('sales', salesModuleInitializer);
} else { console.error("`registerComponentModule` not found for Sales."); }