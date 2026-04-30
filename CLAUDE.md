# CLAUDE.md

## Project Overview

This application is for a T-shirt printing business that fulfils custom print orders for client companies. The fulfilment workflow for each order spans multiple parties and sequential stages: receiving an order from a client, purchasing fabric from a supplier, contracting a stitching vendor, printing the logo, conducting a quality inspection, and finally dispatching and delivering the finished goods.

This business if still in the startup level and this application doesn’t exactly need to be in the production level. First, I need to develop an MVP(minimum viable product) level product.

# Requirements

### Client Management

Client Management

• Customer should be able make an order through the website. Order information include Customer name (client name(company name),customer contact number, email, Order details)
• Email notification should be sent when the order is created.
• Admin should be able to ,
• View client
• Create client.
• Update client information

### Customer Inquiry (Public-Facing)

- Customers can submit an inquiry through a **public page** — no login required.
- The inquiry form collects: customer name, company name, contact number, email,
  and an order description.
- The **description field uses TipTap** rich text editor — supports bold, headings,
  highlights, and bullet points.
- **No file uploads** — if a customer needs to share artwork or logos, that is handled
  through the in-person conversation with the admin after the inquiry is received.
- On submission, an **email notification is sent to all admin owners** via Resend.
- The customer receives a **confirmation message** on screen (not an email).
- The inquiry is **not automatically converted to an order** — it is just a
  notification. The admin contacts the customer in person and creates the order
  manually in the system.
- Inquiries are stored in the database for reference.

### Inquiry

```
name            String    required
companyName     String
contactNumber   String    required
email           String    required
description     String    HTML from TipTap rich text editor
createdAt                 Auto
```

### Order Management

• Admins view the order details.
• Order details should include order number, client, quantity, sizes, additional description, status, deadline, selling price per 1, total price.
• Admins also be able to create new order.
• Update order progress (Pending, confirmed, In-production, quality check, completed, delivered)
• Should be able to mark the quality failures, and the amount/none of quality failures of the orders. For quality failures record the number of failed items on and order.
• Update order details( deadline, quantity, price, notes)
• View orders of a client.
• Admin should be able search and filter orders by order number, status deadline

When a customer submits the inquiry form,it should be arrived as an email to the admin. admin is the one who properly create the order.

Admins should be able to generate invoices to send out to client and the vendors.

### Expense management

Business admin should be able manage all the cost and account replated calculations here. This need not to be a perfect account balancing module. But we need to record all expenses and income and profit data.

Admin should be able add all the expenses. There should be a categorization of expenses( material cost, transport, stitching vendor payment, delivery, other.. etc.) and admin can choose the expense type and add the expense. Expense value should be accepted up to two decimal points.
Admin should be able to add all the income details. Basically, the total amount received from the client. There should be other income category too,
• Profit/loss should be calculated automatically.
• Admins should be able to view the expenses and profits of each order separately. Also should be able to view the total order expenses and total income and profit.
• Admins should be able to view the orders per month, week or particular time period. Same as admin should be able view all the expenses and income, profit details per month, week and any time period.
the selling price would differ based of the cost per unit. admins would discuss and decide the selling price. for now lets keep the as "total price" = quantity × price per unit

Every expense should be linked to an order. for example even if the supplies were bought together for several orders, admins should record the expenses per orders. (you can suggest if there a better way to put this in the system )
There can be both full payments and partial payments from the client, but mostly it can be partial payments.
For the income side — when a client makes a partial payment, the system should track the outstanding balance per order.There should be a way to mark an order as "fully paid" vs "partially paid" vs "unpaid

invoices

1. it should be a downloadable pdf. should be manually triggered by the admin.
2. The payment that business owes to the stitching vendor should be a separate invoice.
3. For the client invoice PDF, include these details(business name/logo, client details, order number, itemed breakdown, total amount, bank details for payment).
4. For the vendor invoice,order number, quantity of the items, price per item, total payment. there will be a separate bank transer for the payment.
5. When the admin triggers the invoice email, Invoice should be attached to the email. there should be an email template (name of the customer, and the description) since its similar for most of the customers.
6.

## Stitching Vendor Management (external contractors)

• Admin should be able to add vendor details (name, contact, address, email, amount of orders assigned)
Supplier management (external suppliers)
• Admins should be able to add supplier details(name, address, email, const per unit, contact)

Suppliers shouldn't need to be linked with the orders. just having their deails is enough. currently we have only one vendor. linking them to orders might be useful when there are multiple vendors. If so can we implement it later?

### Authentication & Users

1. There will be more than one admin(at least 3). basically the owners of this business will be admins. so they should have full permission.
2. No login accounts for clients for now. client can just place an order. it's only as inquiry or just for the recording purpose. the owners will discuss more details with client in person.
3. lets implement forgot password and reset password as well.

Client & Order Form (Customer-facing)

1. This would just be a request or inquiry. Admin will contact the customer after that and then create the order in the system in details
2. It contains , name, email, contact no, description field where customers can upload files and add all kinds of text(highlight, bold, headings etc.).
3. They should receive a confirmation email. There's no need of follow up emails. admin should be able to trigger another email to send the invoices CC ing the other owners.

This system should have following non- functional requirements.
• Security – password, and credentials security
• Reliability – should handle failures and error scenarios well.
• Maintainability – should be able to add , update functionalities later.
• Traceability – Orders should be traceable to a client.
• Auditability – there should be timestamp for creation, update for all records and managed automatically by the system.

# Tech Stack

1.  Node.js, Express.js
2.  REST API backend.
3.  MongoDB
4.  GitHub repository
5.  React frontend.

# Note

Assume you are an expert in Fullstack development in Node.js and react.

Always ask before using new tools and and clarify the need of the tool.
This system needs to be developed in small phases. Also, you should not implement anything beyond scope. But if it’s something that’s not mentioned here and you feel it’s needed, always ask the question without assuming.

Before assuming anything ask away the questions to clarify. Since I’m in the beginner level always clarify the technical decisions, architecture decisions, highlight the important concepts so I can check it separately.
All technical decisions should be discussed before implementation. Because main purpose of developing this is to learn.  
Testing should be carried out parallelly and Unit Tests need to be implemented along with development.
Going forward update this file with the technical decisions and requirment changes and important information.

## Folder Structure

business-app/
├── src/
│ ├── config/ # DB connection, email config
│ ├── controllers/ # One file per feature
│ ├── models/ # Mongoose schemas
│ ├── routes/ # URL definitions
│ ├── middleware/ # Auth, validation, error handling
│ ├── utils/ # PDF generation, email helpers
│ └── tests/ # Unit tests
├── client/ # React frontend (separate folder)
├── .env
└── server.js

## Phase Status Table

| 1 | Foundation & Authentication | ✅ Complete |
| 2 | Inquiry Handling (public form + S3 uploads) | 🔄 In progress |

## Current File State (Phase 2 in progress)

**Complete (Phase 1):**

- `server.js` — entry point, connects DB, starts server
- `src/app.js` — Express app, middleware, routes
- `src/config/db.js` — Mongoose connection singleton
- `src/models/admin.model.js` — Admin schema with bcrypt pre-save hook
- `src/controllers/auth.controller.js` — login, logout, forgotPassword, resetPassword
- `src/middleware/auth.middleware.js` — JWT verification, attaches req.admin
- `src/middleware/error.middleware.js` — global error handler
- `src/routes/auth.routes.js` — auth route definitions
- `scripts/seedAdmins.js` — seeds admin accounts from .env
- `src/tests/auth.test.js` — 11 unit tests, all passing

**To be created in Phase 2:**

- `src/config/s3.js`
- `src/models/inquiry.model.js`
- `src/controllers/inquiry.controller.js`
- `src/routes/inquiry.routes.js`
- `src/utils/s3.js`
- `src/utils/email.js`
- `src/tests/inquiry.test.js`
