-- CreateTable
CREATE TABLE "StockItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "priceTry" INTEGER,
    "priceEur" INTEGER,
    "priceUsd" INTEGER,
    "priceGbp" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VehicleFit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stockItemId" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    CONSTRAINT "VehicleFit_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "userId" INTEGER,
    CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "oldQuantity" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockAdjustment_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockReceipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockReceiptLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptId" INTEGER NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    CONSTRAINT "StockReceiptLine_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "StockReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockReceiptLine_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Şahıs',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "plate" TEXT,
    "notes" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    CONSTRAINT "SaleLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleLine_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleReturn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "saleId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "note" TEXT,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleReturn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleReturnLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "returnId" INTEGER NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    CONSTRAINT "SaleReturnLine_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "SaleReturn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleReturnLine_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "note" TEXT,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentId" INTEGER NOT NULL,
    "saleId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentAllocation_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kind" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "added" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StockSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "StockListValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "group" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role") SELECT "createdAt", "email", "id", "name", "password", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_code_key" ON "StockItem"("code");

-- CreateIndex
CREATE INDEX "StockMovement_stockItemId_idx" ON "StockMovement"("stockItemId");

-- CreateIndex
CREATE UNIQUE INDEX "StockAdjustment_code_key" ON "StockAdjustment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StockReceipt_code_key" ON "StockReceipt"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_code_key" ON "Sale"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SaleReturn_code_key" ON "SaleReturn"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_code_key" ON "Payment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StockListValue_group_value_key" ON "StockListValue"("group", "value");
