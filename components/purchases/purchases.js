// components/purchases/purchases.js

const DUMMY_SELLERS_SOURCE = [
    { id: 's1', name: 'Global Importers Inc.', gstin: '22GHIJL1234K1Z2' },
    { id: 's2', name: 'National Distributors Ltd.', gstin: '19MNOQP5678R1Z9' },
    { id: 's3', name: 'Local Suppliers Co.', gstin: '' },
];
const DUMMY_ITEMS_PURCHASE_SOURCE = [ // Added gstRate
    { id: 'item_dyn_1', name: 'Super Widget A (SWA)', hsn: '847100', mrp: 150, buyingPrice: 90, sellingPrice: 120, gstRate: 0.18, stock: 50 },
    { id: 'item_dyn_2', name: 'Mega Gizmo B (MGB)', hsn: '847101', mrp: 300, buyingPrice: 220, sellingPrice: 275, gstRate: 0.18, stock: 30 },
    { id: 'item_dyn_3', name: 'Basic Unit C (BUC)', hsn: '847102', mrp: 100, buyingPrice: 65, sellingPrice: 85, gstRate: 0.12, stock: 100 },
];

let purchaseCustomSelectIdCounter = 0;
function getPurchaseUniqueCustomSelectId() {
    return `purchase-cs-instance-${purchaseCustomSelectIdCounter++}`;
}

function purchasesModuleInitializer() {
    console.log("Purchases Module Initializing...");

    let currentSellers = JSON.parse(JSON.stringify(DUMMY_SELLERS_SOURCE));
    let currentItems = JSON.parse(JSON.stringify(DUMMY_ITEMS_PURCHASE_SOURCE));

    let sellerSelectManager = null;
    const purchaseActiveCustomSelects = new Set();
    const purchaseItemSelectManagers = new Map();
    let activeItemRowForNewItem = null;
    let newItemGstSelectManager = null; // For the GST dropdown in "Add New Item" form

    const purchasesScreen = document.getElementById('purchases-screen');
    if (!purchasesScreen) { console.warn("Purchases screen HTML not found."); return; }

    const sellerCustomSelectButton = document.getElementById('seller-custom-select-button');
    const sellerCustomSelectOptionsList = document.getElementById('seller-custom-select-options');
    const sellerSelectValueInput = document.getElementById('seller-select-value');
    const sellerCustomSelectSelectedText = document.getElementById('seller-custom-select-selected-text');
    const newSellerForm = document.getElementById('new-seller-form');
    const newSellerNameInput = document.getElementById('new-seller-name');
    const newSellerGstinInput = document.getElementById('new-seller-gstin');
    const saveNewSellerBtn = document.getElementById('save-new-seller-btn');
    const cancelNewSellerBtn = document.getElementById('cancel-new-seller-btn');
    const purchaseDateInput = document.getElementById('purchase-date');
    const sellerInvoiceNumberInput = document.getElementById('seller-invoice-number'); // New Invoice No Input

    const newItemFormSection = document.getElementById('new-item-form-section');
    const newItemNameInput = document.getElementById('new-item-name');
    const newItemHsnInput = document.getElementById('new-item-hsn');
    const newItemMrpInput = document.getElementById('new-item-mrp');
    const newItemBuyingPriceInput = document.getElementById('new-item-buying-price');
    const newItemSellingPriceInput = document.getElementById('new-item-selling-price');
    // For new item GST custom dropdown
    const newItemGstSelectButton = document.getElementById('new-item-gst-select-button');
    const newItemGstSelectOptionsList = document.getElementById('new-item-gst-select-options');
    const newItemGstSelectValueInput = document.getElementById('new-item-gst-select-value');
    const newItemGstSelectSelectedText = document.getElementById('new-item-gst-select-selected-text');
    const saveNewItemBtn = document.getElementById('save-new-item-btn');
    const cancelAddNewItemBtn = document.getElementById('cancel-add-new-item-btn');

    const purchaseItemRowsContainer = document.getElementById('purchase-item-rows-container');
    const addPurchaseItemBtn = document.getElementById('add-purchase-item-btn');
    const purchaseItemRowTemplate = document.querySelector('.purchase-item-row-template');

    const purchaseSubtotalEl = document.getElementById('purchase-subtotal-amount');
    const purchaseGstEl = document.getElementById('purchase-gst-amount');
    const purchaseGrandTotalEl = document.getElementById('purchase-grand-total-amount');
    const clearPurchaseBtn = document.getElementById('clear-purchase-btn');
    const savePurchaseBtn = document.getElementById('save-purchase-btn');

    const purchaseSuccessPopup = document.getElementById('purchase-success-popup');
    const purchaseSuccessPopupContent = document.getElementById('purchase-success-popup-content');
    const closePurchasePopupBtn = document.getElementById('close-purchase-popup-btn');

    function formatCurrency(amount) { return `₹${amount.toFixed(2)}`; }

    function setupPurchaseCustomSelect(
        instanceId, buttonEl, optionsListEl, hiddenInputEl, selectedTextEl,
        items, defaultText, onSelectCallback
    ) {
        selectedTextEl.textContent = defaultText;
        hiddenInputEl.value = "";
        const labelEl = buttonEl.closest('div.relative')?.previousElementSibling;
        if (labelEl && labelEl.id) buttonEl.setAttribute('aria-labelledby', `${labelEl.id} ${buttonEl.id || `btn-${instanceId}`}`);
        else buttonEl.setAttribute('aria-labelledby', buttonEl.id || `btn-${instanceId}`);

        const instance = {
            id: instanceId, buttonEl, optionsListEl,
            isOpen: () => !optionsListEl.classList.contains('hidden'),
            close: () => { optionsListEl.classList.add('hidden'); buttonEl.setAttribute('aria-expanded', 'false'); },
            open: () => {
                purchaseActiveCustomSelects.forEach(cs => { if (cs.id !== instanceId && cs.isOpen()) cs.close(); });
                optionsListEl.classList.remove('hidden'); buttonEl.setAttribute('aria-expanded', 'true');
            }
        };
        purchaseActiveCustomSelects.add(instance);

        function populateOptions(currentVal) {
            optionsListEl.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 group hover:bg-indigo-600 hover:text-white';
                li.id = `purchase-custom-opt-${instanceId}-${item.id || 'default'}`;
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
                    if (onSelectCallback) onSelectCallback(item.id, buttonEl.closest('.purchase-item-row'));
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
            destroy: () => { purchaseActiveCustomSelects.delete(instance); },
            getValue: () => hiddenInputEl.value,
            setValue: (val) => {
                const selectedItem = items.find(i => i.id === val);
                if (selectedItem) {
                    selectedTextEl.textContent = selectedItem.name; hiddenInputEl.value = val; populateOptions(val);
                    if (onSelectCallback) onSelectCallback(val, buttonEl.closest('.purchase-item-row'));
                } else {
                    selectedTextEl.textContent = defaultText; hiddenInputEl.value = ""; populateOptions("");
                }
            }
        };
    }

    const purchaseGlobalClickListener = (e) => {
        purchaseActiveCustomSelects.forEach(cs => {
            if (cs.buttonEl && !cs.buttonEl.contains(e.target) && cs.optionsListEl && !cs.optionsListEl.contains(e.target) && cs.isOpen()) {
                cs.close();
            }
        });
    };
    document.removeEventListener('click', purchaseGlobalClickListener);
    document.addEventListener('click', purchaseGlobalClickListener);

    function handleSellerCustomSelect(selectedValue) {
        if (newSellerForm) {
            if (selectedValue === 'new_seller') {
                newSellerForm.classList.add('slide-down');
                if(newSellerNameInput) newSellerNameInput.focus();
            } else {
                newSellerForm.classList.remove('slide-down');
            }
        }
    }
    function saveNewSeller() {
        const name = newSellerNameInput.value.trim();
        if (!name) { alert('Seller name is required.'); return; }
        const newSellerId = `s_dyn_${Date.now()}`;
        currentSellers.push({ id: newSellerId, name, gstin: newSellerGstinInput.value.trim() });
        const sellerOptions = [
            { id: "", name: "-- Select Seller --" },
            ...currentSellers.map(s => ({ id: s.id, name: `${s.name} ${s.gstin ? '('+s.gstin+')' : ''}` })),
            { id: "new_seller", name: "-- Add New Seller --" }
        ];
        if(sellerSelectManager) sellerSelectManager.refresh(sellerOptions, newSellerId);
        if(newSellerForm) newSellerForm.classList.remove('slide-down');
        if(newSellerNameInput) newSellerNameInput.value = '';
        if(newSellerGstinInput) newSellerGstinInput.value = '';
        alert('New seller added!');
    }
    function cancelNewSeller() {
        if(newSellerForm) newSellerForm.classList.remove('slide-down');
        if(newSellerNameInput) newSellerNameInput.value = '';
        if(newSellerGstinInput) newSellerGstinInput.value = '';
    }

    function showNewItemForm(triggeringRow) {
        activeItemRowForNewItem = triggeringRow;
        if (newItemFormSection) {
            newItemFormSection.classList.add('fade-in-form');
            if(newItemNameInput) newItemNameInput.focus();
            const buyingPriceInputInRow = triggeringRow?.querySelector('.purchase-item-buying-price');
            if (buyingPriceInputInRow && buyingPriceInputInRow.value && newItemBuyingPriceInput) {
                newItemBuyingPriceInput.value = buyingPriceInputInRow.value;
            }
        }
    }
    function hideNewItemForm() {
        if (newItemFormSection) {
            newItemFormSection.classList.remove('fade-in-form');
        }
        if(newItemNameInput) newItemNameInput.value = '';
        if(newItemHsnInput) newItemHsnInput.value = '';
        if(newItemMrpInput) newItemMrpInput.value = '';
        if(newItemBuyingPriceInput) newItemBuyingPriceInput.value = '';
        if(newItemSellingPriceInput) newItemSellingPriceInput.value = '';
        if(newItemGstSelectManager) newItemGstSelectManager.setValue("0.18"); // Reset custom GST dropdown
        activeItemRowForNewItem = null;
    }
    function saveNewInventoryItem() {
        const name = newItemNameInput.value.trim();
        const buyingPrice = parseFloat(newItemBuyingPriceInput.value);
        if (!name) { alert('Item Name is required.'); return; }
        if (isNaN(buyingPrice) || buyingPrice <= 0) { alert('Valid Buying Price is required.'); return; }

        const gstRateString = newItemGstSelectManager ? newItemGstSelectManager.getValue() : "0.18";
        const gstRate = parseFloat(gstRateString);

        const newItemData = {
            id: `item_dyn_${Date.now()}`, name,
            hsn: newItemHsnInput.value.trim(),
            mrp: parseFloat(newItemMrpInput.value) || 0,
            buyingPrice,
            sellingPrice: parseFloat(newItemSellingPriceInput.value) || buyingPrice,
            gstRate, stock: 0
        };
        currentItems.push(newItemData);
        alert(`Item "${name}" added to inventory list!`);
        hideNewItemForm();

        purchaseItemRowsContainer.querySelectorAll('.purchase-item-row:not(.purchase-item-row-template)').forEach(row => {
            const manager = purchaseItemSelectManagers.get(row);
            if (manager) {
                const currentItemOpts = [
                    { id: "", name: "-- Select Item --"}, { id: "add_new_item", name: "✨ -- Add New Item -- ✨"},
                    ...currentItems.map(i => ({ id: i.id, name: i.name }))
                ];
                manager.refresh(currentItemOpts, manager.getValue());
            }
        });

        if (activeItemRowForNewItem) {
            const manager = purchaseItemSelectManagers.get(activeItemRowForNewItem);
            if (manager) manager.setValue(newItemData.id);
            const qtyInput = activeItemRowForNewItem.querySelector('.purchase-item-quantity');
            if (qtyInput) qtyInput.focus();
        }
        activeItemRowForNewItem = null;
    }

    function handlePurchaseItemCustomSelect(itemId, itemRowElement) {
        if (!itemRowElement) return;
        if (itemId === 'add_new_item') {
            showNewItemForm(itemRowElement);
            const manager = purchaseItemSelectManagers.get(itemRowElement);
            if (manager) manager.setValue("");
            return;
        }
        const selectedItemData = currentItems.find(i => i.id === itemId);
        const buyingPriceInput = itemRowElement.querySelector('.purchase-item-buying-price');
        const itemGstRateHiddenInput = itemRowElement.querySelector('.purchase-item-gst-rate-hidden'); // Corrected class name for purchase item

        if (selectedItemData) {
            if(buyingPriceInput) buyingPriceInput.value = parseFloat(selectedItemData.buyingPrice || 0).toFixed(2);
            if(itemGstRateHiddenInput) itemGstRateHiddenInput.value = selectedItemData.gstRate || 0;
        } else {
            if(buyingPriceInput) buyingPriceInput.value = '';
            if(itemGstRateHiddenInput) itemGstRateHiddenInput.value = 0;
        }
        updatePurchaseLineTotal(itemRowElement);
    }

    function addPurchaseItemRow() {
        if (!purchaseItemRowTemplate) { console.error("Purchase item row template missing!"); return; }
        const newRow = purchaseItemRowTemplate.cloneNode(true);
        newRow.classList.remove('purchase-item-row-template', 'hidden');

        const itemButtonEl = newRow.querySelector('.purchase-item-custom-select-button');
        const itemOptionsListEl = newRow.querySelector('.purchase-item-custom-select-options');
        const itemHiddenInputEl = newRow.querySelector('.purchase-item-select-value');
        const itemSelectedTextEl = newRow.querySelector('.purchase-item-custom-select-selected-text');
        const itemLabel = newRow.querySelector('.purchase-item-custom-select-label');

        const uniqueRowIdSuffix = getPurchaseUniqueCustomSelectId();
        if (itemButtonEl) itemButtonEl.id = `p-item-btn-${uniqueRowIdSuffix}`;
        if (itemOptionsListEl) itemOptionsListEl.id = `p-item-opts-${uniqueRowIdSuffix}`;
        if (itemLabel) itemLabel.id = `p-item-lbl-${uniqueRowIdSuffix}`;

        const itemOptions = [
            { id: "", name: "-- Select Item --"}, { id: "add_new_item", name: "✨ -- Add New Item -- ✨"},
            ...currentItems.map(item => ({ id: item.id, name: item.name }))
        ];
        if (itemButtonEl && itemOptionsListEl && itemHiddenInputEl && itemSelectedTextEl) {
            const manager = setupPurchaseCustomSelect(
                `p-item-mgr-${uniqueRowIdSuffix}`, itemButtonEl, itemOptionsListEl, itemHiddenInputEl, itemSelectedTextEl,
                itemOptions, "-- Select Item --", handlePurchaseItemCustomSelect
            );
            purchaseItemSelectManagers.set(newRow, manager);
        }
        const qtyInput = newRow.querySelector('.purchase-item-quantity');
        if(qtyInput) qtyInput.value = '1';
        const buyPriceInput = newRow.querySelector('.purchase-item-buying-price');
        if(buyPriceInput) buyPriceInput.value = '';
        const gstRateHidden = newRow.querySelector('.purchase-item-gst-rate-hidden'); // Corrected class name
        if(gstRateHidden) gstRateHidden.value = '0';
        const gstAmountEl = newRow.querySelector('.purchase-item-gst-amount'); // Corrected class name
        if(gstAmountEl) gstAmountEl.value = formatCurrency(0);
        const taxableValueEl = newRow.querySelector('.purchase-item-taxable-value'); // Corrected class name
        if(taxableValueEl) taxableValueEl.value = formatCurrency(0);

        purchaseItemRowsContainer.appendChild(newRow);
        if (itemButtonEl) itemButtonEl.focus();
        calculateOverallPurchaseTotals();
    }

    function handlePurchaseItemRowChange(event) {
        const target = event.target;
        const itemRow = target.closest('.purchase-item-row:not(.purchase-item-row-template)');
        if (!itemRow) return;
        if (target.classList.contains('purchase-item-quantity') || target.classList.contains('purchase-item-buying-price')) {
            if (target.classList.contains('purchase-item-quantity') && parseInt(target.value) < 1 && target.value !== "") target.value = 1;
            updatePurchaseLineTotal(itemRow);
        }
    }
    function handlePurchaseItemRowClick(event) {
        const removeButton = event.target.closest('.remove-purchase-item-btn');
        if (removeButton) {
            const itemRow = removeButton.closest('.purchase-item-row:not(.purchase-item-row-template)');
            if (!itemRow) return;
            if (purchaseItemRowsContainer.querySelectorAll('.purchase-item-row:not(.purchase-item-row-template)').length > 1) {
                const manager = purchaseItemSelectManagers.get(itemRow);
                if (manager) { manager.destroy(); purchaseItemSelectManagers.delete(itemRow); }
                itemRow.remove();
                calculateOverallPurchaseTotals();
            } else { alert("Cannot remove the last item."); }
        }
    }
    function updatePurchaseLineTotal(itemRow) {
        const qty = parseFloat(itemRow.querySelector('.purchase-item-quantity')?.value) || 0;
        const price = parseFloat(itemRow.querySelector('.purchase-item-buying-price')?.value) || 0;
        const itemGstRate = parseFloat(itemRow.querySelector('.purchase-item-gst-rate-hidden')?.value) || 0; // Corrected class name

        const taxableValue = qty * price;
        const gstAmountForItem = taxableValue * itemGstRate;

        const taxableValueEl = itemRow.querySelector('.purchase-item-taxable-value'); // Corrected class name
        if (taxableValueEl) taxableValueEl.value = formatCurrency(taxableValue);
        const gstAmountEl = itemRow.querySelector('.purchase-item-gst-amount'); // Corrected class name
        if (gstAmountEl) gstAmountEl.value = formatCurrency(gstAmountForItem);

        calculateOverallPurchaseTotals();
    }
    function calculateOverallPurchaseTotals() {
        let totalTaxableValue = 0;
        let totalGstAmount = 0;
        purchaseItemRowsContainer.querySelectorAll('.purchase-item-row:not(.purchase-item-row-template)').forEach(row => {
            const taxableValStr = row.querySelector('.purchase-item-taxable-value')?.value.replace(/[^\d.-]/g, ''); // Corrected
            const gstAmtStr = row.querySelector('.purchase-item-gst-amount')?.value.replace(/[^\d.-]/g, ''); // Corrected
            totalTaxableValue += parseFloat(taxableValStr) || 0;
            totalGstAmount += parseFloat(gstAmtStr) || 0;
        });
        const grandTotal = totalTaxableValue + totalGstAmount;

        if(purchaseSubtotalEl) purchaseSubtotalEl.textContent = formatCurrency(totalTaxableValue);
        if(purchaseGstEl) purchaseGstEl.textContent = formatCurrency(totalGstAmount);
        if(purchaseGrandTotalEl) purchaseGrandTotalEl.textContent = formatCurrency(grandTotal);
    }

    function handleSavePurchase() {
        const sellerId = sellerSelectManager ? sellerSelectManager.getValue() : '';
        if (!sellerId || sellerId === 'new_seller') { alert('Please select or add a seller.'); return; }
        const sellerInvNo = sellerInvoiceNumberInput ? sellerInvoiceNumberInput.value.trim() : '';

        const items = []; let hasValidItem = false;
        purchaseItemRowsContainer.querySelectorAll('.purchase-item-row:not(.purchase-item-row-template)').forEach(row => {
            const itemManager = purchaseItemSelectManagers.get(row);
            const itemId = itemManager ? itemManager.getValue() : '';
            const quantityInput = row.querySelector('.purchase-item-quantity');
            const buyingPriceInput = row.querySelector('.purchase-item-buying-price');
            const itemGstRate = parseFloat(row.querySelector('.purchase-item-gst-rate-hidden')?.value) || 0; // Corrected

            if(itemId && quantityInput && buyingPriceInput) {
                const quantity = parseInt(quantityInput.value);
                const buyingPrice = parseFloat(buyingPriceInput.value);
                if (quantity > 0 && buyingPrice >= 0) { // Price can be 0
                    items.push({ itemId, quantity, buyingPrice, itemGstRate }); hasValidItem = true;
                }
            }
        });
        if (!hasValidItem) { alert('Add at least one valid item.'); return; }
        const purchaseData = {
            sellerId, items, sellerInvoiceNumber: sellerInvNo,
            purchaseDate: purchaseDateInput ? purchaseDateInput.value : new Date().toISOString().slice(0,10),
            totalTaxableValue: parseFloat(purchaseSubtotalEl.textContent.replace(/[^\d.-]/g, '')),
            totalGstAmount: parseFloat(purchaseGstEl.textContent.replace(/[^\d.-]/g, '')),
            grandTotal: parseFloat(purchaseGrandTotalEl.textContent.replace(/[^\d.-]/g, ''))
        };
        console.log("Purchase to save:", purchaseData);
        showPurchaseSuccessPopup();
    }

    function showPurchaseSuccessPopup() {
        if (!purchaseSuccessPopup || !purchaseSuccessPopupContent) { console.error("Popup elements missing"); return; }
        purchaseSuccessPopup.classList.remove('hidden');
        void purchaseSuccessPopup.offsetWidth;
        setTimeout(() => {
            purchaseSuccessPopup.classList.add('fade-in');
            purchaseSuccessPopupContent.classList.remove('opacity-0', 'scale-95');
            purchaseSuccessPopupContent.classList.add('opacity-100', 'scale-100');
        }, 10);
    }
    function closePurchaseSuccessPopup() {
        if (!purchaseSuccessPopup || !purchaseSuccessPopupContent) return;
        purchaseSuccessPopup.classList.remove('fade-in');
        purchaseSuccessPopupContent.classList.remove('opacity-100', 'scale-100');
        purchaseSuccessPopupContent.classList.add('opacity-0', 'scale-95');
        setTimeout(() => { purchaseSuccessPopup.classList.add('hidden'); }, 300);
    }
    function clearPurchaseForm() {
        if (sellerSelectManager) {
            const sellerOptions = [
                { id: "", name: "-- Select Seller --" },
                ...currentSellers.map(s => ({ id: s.id, name: `${s.name} ${s.gstin ? '('+s.gstin+')' : ''}` })),
                { id: "new_seller", name: "-- Add New Seller --" }
            ];
            sellerSelectManager.refresh(sellerOptions, "");
        }
        cancelNewSeller();
        hideNewItemForm();
        if (purchaseDateInput) purchaseDateInput.valueAsDate = new Date();
        if (sellerInvoiceNumberInput) sellerInvoiceNumberInput.value = ''; // Clear invoice number

        purchaseItemRowsContainer.querySelectorAll('.purchase-item-row:not(.purchase-item-row-template)').forEach(row => {
            const m = purchaseItemSelectManagers.get(row); if(m) m.destroy(); row.remove();
        });
        purchaseItemSelectManagers.clear();
        addPurchaseItemRow();
        calculateOverallPurchaseTotals();
        if (sellerCustomSelectButton) sellerCustomSelectButton.focus();
    }

    // Event Listeners
    if (saveNewSellerBtn) saveNewSellerBtn.addEventListener('click', saveNewSeller);
    if (cancelNewSellerBtn) cancelNewSellerBtn.addEventListener('click', cancelNewSeller);
    if (saveNewItemBtn) saveNewItemBtn.addEventListener('click', saveNewInventoryItem);
    if (cancelAddNewItemBtn) cancelAddNewItemBtn.addEventListener('click', hideNewItemForm);
    if (addPurchaseItemBtn) addPurchaseItemBtn.addEventListener('click', addPurchaseItemRow);
    if (clearPurchaseBtn) clearPurchaseBtn.addEventListener('click', clearPurchaseForm);
    if (savePurchaseBtn) savePurchaseBtn.addEventListener('click', handleSavePurchase);
    if (closePurchasePopupBtn) closePurchasePopupBtn.addEventListener('click', closePurchaseSuccessPopup);
    if (purchaseItemRowsContainer) {
        purchaseItemRowsContainer.addEventListener('change', handlePurchaseItemRowChange);
        purchaseItemRowsContainer.addEventListener('click', handlePurchaseItemRowClick);
    }

    // Initializations
    if (purchaseDateInput && !purchaseDateInput.value) purchaseDateInput.valueAsDate = new Date();
    if (sellerCustomSelectButton) {
        const sellerOptions = [
            { id: "", name: "-- Select Seller --" },
            ...currentSellers.map(s => ({ id: s.id, name: `${s.name} ${s.gstin ? '('+s.gstin+')' : ''}` })),
            { id: "new_seller", name: "-- Add New Seller --" }
        ];
        sellerSelectManager = setupPurchaseCustomSelect(
            'seller-main-select', sellerCustomSelectButton, sellerCustomSelectOptionsList,
            sellerSelectValueInput, sellerCustomSelectSelectedText, sellerOptions,
            "-- Select Seller --", handleSellerCustomSelect
        );
    }
    // Initialize GST dropdown for "Add New Item" form
    if (newItemGstSelectButton) {
        const gstRateOptions = [
            { id: "0", name: "0%" }, { id: "0.05", name: "5%" }, { id: "0.12", name: "12%" },
            { id: "0.18", name: "18%" }, { id: "0.28", name: "28%" }
        ];
        newItemGstSelectManager = setupPurchaseCustomSelect(
            'new-item-gst-rate-select-manager', newItemGstSelectButton, newItemGstSelectOptionsList,
            newItemGstSelectValueInput, newItemGstSelectSelectedText, gstRateOptions, "18%", null
        );
        if(newItemGstSelectManager) newItemGstSelectManager.setValue("0.18"); // Set default
    }

    if (purchaseItemRowsContainer.querySelectorAll('.purchase-item-row:not(.purchase-item-row-template)').length === 0) {
        addPurchaseItemRow();
    }
    calculateOverallPurchaseTotals();
    console.log("Purchases Module Initialized.");
}

if (window.registerComponentModule) {
    window.registerComponentModule('purchases', purchasesModuleInitializer);
} else { console.error("`registerComponentModule` not found for Purchases."); }