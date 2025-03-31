from flask import Flask,jsonify,request,send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
import datetime
from sqlalchemy import extract
from werkzeug.utils import secure_filename
import os
import json
from collections import defaultdict
from fpdf import FPDF
from werkzeug.security import generate_password_hash, check_password_hash
from flask_bcrypt import Bcrypt
import io
import re
import traceback
from collections import defaultdict
from datetime import timedelta
from pprint import pprint  



app=Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql://root:@127.0.0.1/ComponentsPurchased"
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
CORS(app)
db=SQLAlchemy(app)
ma=Marshmallow(app)
bcrypt = Bcrypt(app)


def preprocess(string):
    if(string):
     string=string.rstrip()
    if(string):
     string=string.lower()
    if(string):
     string=string.title()
    return string


class RegisteredUsers(db.Model):
    __tablename__ = 'RegisteredUsers'

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Auto-increment ID
    email = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)  
    password = db.Column(db.String(200), nullable=False)  # Store hashed password

    def __init__(self, email, username, password):
        self.email = email
        self.username = username
        self.password = password  # This should be a hashed password


# Schema for serialization
class RegisteredUsersSchema(ma.Schema):
    class Meta:
        fields = ('user_id', 'email', 'username', 'password')  # Include 'id' field


registered_user_schema = RegisteredUsersSchema()
registered_users_schema = RegisteredUsersSchema(many=True)


## added new code with different tables

class Vendors(db.Model):
    __tablename__ = 'vendors'
    vendor_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    vendor_name = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey('RegisteredUsers.user_id'), nullable=False)  # FK to RegisteredUsers.user_id
    purchases = db.relationship('Purchases', backref='vendor', cascade="all, delete")

    def __init__(self, vendor_name, user_id):
        self.vendor_name = vendor_name
        self.user_id = user_id  # Associate with logged-in user


class Components(db.Model):
    __tablename__ = 'components'
    component_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    component_name = db.Column(db.String(100), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.vendor_id'), nullable=False)  # FK to Vendors.vendor_id
    user_id = db.Column(db.Integer, db.ForeignKey('RegisteredUsers.user_id'), nullable=False)  # FK to RegisteredUsers.user_id
    purchases = db.relationship('Purchases', backref='component', cascade="all, delete")

    def __init__(self, component_name, vendor_id, user_id):
        self.component_name = component_name
        self.vendor_id = vendor_id  # Associate component with vendor
        self.user_id = user_id  # Associate component with logged-in user



class Invoices(db.Model):
    __tablename__ = 'invoices'
    invoice_no = db.Column(db.String(100), primary_key=True)
    invoice_pdf_name = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey('RegisteredUsers.user_id'), nullable=False)  # FK to RegisteredUsers.user_id
    purchases = db.relationship('Purchases', backref='invoice', cascade="all, delete")

    def __init__(self, invoice_no, invoice_pdf_name, user_id):
        self.invoice_pdf_name = invoice_pdf_name
        self.invoice_no = invoice_no
        self.user_id = user_id  # Associate with logged-in user


class Purchases(db.Model):
    __tablename__ = 'purchases'
    purchases_id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.vendor_id'))
    component_id = db.Column(db.Integer, db.ForeignKey('components.component_id'))
    invoice_no = db.Column(db.String(100), db.ForeignKey('invoices.invoice_no'))
    stock_entry = db.Column(db.String(50))
    purchased_quantity = db.Column(db.Integer)
    purchased_price = db.Column(db.Float)
    purchased_date = db.Column(db.Date)
    supplied_to = db.Column(db.String(100), nullable=False)
    updated_date = db.Column(db.DateTime, default=datetime.datetime.now)
    user_id = db.Column(db.Integer, db.ForeignKey('RegisteredUsers.user_id'), nullable=False)  # FK to RegisteredUsers.user_id

    def __init__(self, vendor_id, component_id, invoice_no, stock_entry, purchased_quantity, 
                 purchased_price, purchased_date, supplied_to, user_id):
        self.component_id = component_id
        self.invoice_no = invoice_no
        self.stock_entry = stock_entry
        self.purchased_quantity = purchased_quantity
        self.purchased_price = purchased_price
        self.purchased_date = purchased_date
        self.supplied_to = supplied_to
        self.vendor_id = vendor_id
        self.user_id = user_id  # Associate with logged-in user




with app.app_context():
    db.create_all()


def process_vendor(vendor_name,user_id):
    vendor_name=preprocess(vendor_name)
    vendor_exists=Vendors.query.filter_by(vendor_name=vendor_name).first()
    if not vendor_exists:  
        new_vendor = Vendors(vendor_name,user_id)
        db.session.add(new_vendor)
        db.session.commit()

        
    vendor_id=Vendors.query.filter_by(vendor_name=vendor_name).first().vendor_id
    return vendor_id


def process_component(component_name, vendor_id, user_id):

    component_name = preprocess(component_name)

    # Check if component already exists for this vendor
    component_exists = Components.query.filter_by(component_name=component_name, vendor_id=vendor_id, user_id=user_id).first()

    if not component_exists:
        try:
            new_component = Components(component_name, vendor_id, user_id)
            db.session.add(new_component)
            db.session.commit()
        except Exception as e:
            db.session.rollback()  # Rollback transaction in case of error
            print(f"Error inserting component: {e}")

    component_id = Components.query.filter_by(component_name=component_name, vendor_id=vendor_id, user_id=user_id).first().component_id
    return component_id




def add_to_db(vendor_name,component_name,purchased_quantity,purchased_price,purchased_date,stock_entry,invoice_no,invoice_pdf_name,supplied_to,user_id):
    with app.app_context():
        
        vendor_id=process_vendor(vendor_name,user_id)

        component_id = process_component(component_name, vendor_id, user_id)
                    
        
        invoice_exists=Invoices.query.filter_by(invoice_no=invoice_no).first()
        if not invoice_exists:    
            new_invoice = Invoices(invoice_no, invoice_pdf_name, user_id)
            db.session.add(new_invoice)
            db.session.commit()
          
        new_purchase = Purchases(vendor_id,component_id,invoice_no,stock_entry,purchased_quantity,purchased_price,purchased_date,supplied_to,user_id)
        db.session.add(new_purchase)
        db.session.commit()
   

  ## new route for adding purchased components 

@app.route('/purchasedcomponents/postall',methods=['POST'])
def postall_purchased_components():
    try:
        with app.app_context():
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No selected file"}), 400

            if file and file.filename.endswith('.pdf'):
                filename = secure_filename(file.filename)
                if filename:  # Ensure filename is not empty
                   timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")  # Format: YYYYMMDDHHMMSS
                   file_extension = filename.rsplit('.', 1)[1] if '.' in filename else 'txt'  # Extract extension safely
                   new_filename = f"{timestamp}.{file_extension}"  # Create new filename with timestamp
                   filename=new_filename
                   filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
                   file.save(filepath)  # Save the file with the new timestamped name
                else:
                   print("Error: No valid filename provided.")
                vendor=preprocess(request.form.get('vendor'))
                PurchasedDate=preprocess(request.form.get('PurchasedDate'))
                InvoiceNo=preprocess(request.form.get('InvoiceNo'))
                suppliedTo=request.form.get('suppliedTo')
                user_id=request.form.get('user_id')
                components=request.form.get('components')
                components = json.loads(components) if components else []
                for i in components:
                    selectedComponentPurchased=preprocess(i['selectedComponentPurchased'])
                    QuantityPurchased=i['QuantityPurchased']
                    PurchasedPrice=i['PurchasedPrice']
                    StockEntry=i['StockEntry']
                    add_to_db(vendor,selectedComponentPurchased,QuantityPurchased,PurchasedPrice,PurchasedDate,StockEntry,InvoiceNo,filename,suppliedTo,user_id)
                return '201'
            else:
                return '400'
    except:
        return '400'

    
@app.route('/view', methods=['GET'])
def view_pdf():
    invoice_no = request.args.get("invoice_no")  # Extract invoice_no from query params
    user_id = request.args.get("user_id")  # Extract user_id from query params

    if not invoice_no or not user_id:
        return jsonify({"error": "Invoice number and user_id are required"}), 400

    try:
        # Fetch invoice record based on invoice_no and user_id
        invoice = Invoices.query.filter_by(invoice_no=invoice_no, user_id=user_id).first()

        if not invoice:
            return jsonify({"error": "Invoice not found for the given user"}), 404

        # Construct the file path
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], invoice.invoice_pdf_name)


        # Check if the file exists
        if os.path.exists(filepath):
            return send_file(filepath, mimetype='application/pdf')
        else:
            return jsonify({"error": "File not found"}), 404

    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        print(traceback.format_exc())  # Print full error traceback
        return jsonify({"error": str(e)}), 500
        


@app.route('/purchasedcomponents/put', methods=['PUT'])
def put_purchased_components():
    try:
        with app.app_context():

            # Extract data from request
            id = request.json.get('id')
            user_id = request.json.get('user_id')  # Ensure data is user-specific
            vendor_id = request.json.get('vendorId')  
            component_id = request.json.get('componentId')  
            invoice_no = request.json.get('InvoiceNo')  
            QuantityPurchased = request.json.get('QuantityPurchased')
            PurchasedPrice = request.json.get('PurchasedPrice')
            PurchasedDate = request.json.get('PurchasedDate')  
            StockEntry = request.json.get('StockEntry')
            SuppliedTo = request.json.get('suppliedTo')
            selectedVendor = preprocess(request.json.get('selectedVendor'))  
            selectedComponentPurchased = preprocess(request.json.get('selectedComponentPurchased'))

            # Convert date format to YYYY-MM-DD
            try:
                # Check if the date is already in YYYY-MM-DD format
                if len(PurchasedDate) == 10 and PurchasedDate.count('-') == 2:
                    datetime.datetime.strptime(PurchasedDate, "%Y-%m-%d")  # Validate format
                else:
                    # Parse from "Day, DD Mon YYYY HH:MM:SS GMT" format
                    PurchasedDate = datetime.datetime.strptime(PurchasedDate, "%a, %d %b %Y %H:%M:%S GMT").strftime("%Y-%m-%d")

            except ValueError:
                PurchasedDate = None  # Set to None or handle as needed
                return jsonify({"error": "Invalid date format"}), 400

            # Find existing purchase entry
            purchase = Purchases.query.filter_by(purchases_id=id, user_id=user_id).first()

            if not purchase:
                return jsonify({"error": "Purchase record not found"}), 404

            # Update Vendor if name has changed
            vendor = Vendors.query.filter_by(vendor_id=vendor_id, user_id=user_id).first()
            if vendor and vendor.vendor_name != selectedVendor:
                vendor.vendor_name = selectedVendor
                db.session.commit()

            # Update Component if name has changed
            component = Components.query.filter_by(component_id=component_id, user_id=user_id,vendor_id=vendor_id).first()
            if component and component.component_name != selectedComponentPurchased:
                component.component_name = selectedComponentPurchased
                db.session.commit()

            # Update Invoice if invoice number has changed
            invoice = Invoices.query.filter_by(invoice_no=invoice_no, user_id=user_id).first()
            if not invoice:
                invoice = Invoices(invoice_no, f"{invoice_no}.pdf", user_id)
                db.session.add(invoice)
                db.session.commit()

            # Update purchase record
            purchase.vendor_id = vendor.vendor_id
            purchase.component_id = component.component_id
            purchase.invoice_no = invoice.invoice_no
            purchase.purchased_quantity = QuantityPurchased
            purchase.purchased_price = PurchasedPrice
            purchase.purchased_date = PurchasedDate
            purchase.stock_entry = StockEntry
            purchase.supplied_to = SuppliedTo
            purchase.updated_date = datetime.datetime.now()

            db.session.commit()

            return jsonify({"status": "Updated Successfully"}), 201

    except Exception as e:
        print("Error occurred:", traceback.format_exc())  # Log detailed error
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

    

@app.route('/purchases/update', methods=['PUT'])
def update_purchase():
    try:
        with app.app_context():
            purchase_id = request.json.get('id')

            # Fetch vendor_id from vendor name
            vendor_name = preprocess(request.json.get('selectedVendor'))
            vendor = Vendors.query.filter_by(vendor_name=vendor_name).first()
            if not vendor:
                return jsonify({"error": "Vendor not found"}), 404

            # Fetch component_id from component name
            component_name = preprocess(request.json.get('selectedComponentPurchased'))
            component = Components.query.filter_by(component_name=component_name).first()
            if not component:
                return jsonify({"error": "Component not found"}), 404

            # Fetch invoice details
            invoice_no = request.json.get('InvoiceNo')
            invoice = Invoices.query.filter_by(invoice_no=invoice_no).first()
            if not invoice:
                return jsonify({"error": "Invoice not found"}), 404

            # Find the purchase record to update
            purchase = Purchases.query.filter_by(purchases_id=purchase_id).first()
            if not purchase:
                return jsonify({"error": "Purchase record not found"}), 404

            # Update the purchase record
            purchase.vendor_id = vendor.vendor_id
            purchase.component_id = component.component_id
            purchase.invoice_no = invoice.invoice_no
            purchase.purchased_quantity = request.json.get('QuantityPurchased')
            purchase.purchased_price = request.json.get('PurchasedPrice')
            purchase.purchased_date = request.json.get('PurchasedDate')
            purchase.stock_entry = request.json.get('StockEntry')
            purchase.supplied_to = request.json.get('SuppliedTo')  # Added supplied_to field
            purchase.updated_date = datetime.datetime.now()

            db.session.commit()
            return jsonify({"message": "Purchase record updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400



@app.route('/purchasedcomponents/delete/<int:delID>/<int:componentId>/<string:invoiceNo>/<int:vendorId>/', methods=['DELETE'])
def delete_purchased_components_and_component(delID, componentId, invoiceNo, vendorId):
    try:
        with app.app_context():

            # Fetch the purchase record
            purchase = Purchases.query.filter_by(purchases_id=delID).first()

            if not purchase:
                return jsonify({"error": "Purchase record not found"}), 404

            # Delete the purchase record
            db.session.delete(purchase)
            db.session.commit()

            # Check if the component is still used in other purchases
            other_purchases = Purchases.query.filter_by(component_id=componentId).count()

            if other_purchases == 0:
                # If no other purchases use this component, delete the component record
                component = Components.query.filter_by(component_id=componentId,vendor_id=vendorId).first()
                if component:
                    db.session.delete(component)
                    db.session.commit()

            # Check if the vendor_id is still used in other purchases
            vendor_usage = Purchases.query.filter_by(vendor_id=vendorId).count()

            if vendor_usage == 0:
                vendor = Vendors.query.filter_by(vendor_id=vendorId).first()
                if vendor:
                    db.session.delete(vendor)
                    db.session.commit()

            # Check if the invoice_no is still used in other purchases
            invoice_usage = Purchases.query.filter_by(invoice_no=invoiceNo).count()

            if invoice_usage == 0:
                invoice = Invoices.query.filter_by(invoice_no=invoiceNo).first()
                if invoice:
                    invoice_pdf_name = invoice.invoice_pdf_name
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], invoice_pdf_name)
                    db.session.delete(invoice)
                    db.session.commit()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    else:
                        print(f"File not found: {file_path}")

            return jsonify({"status": "Deleted Successfully"}), 200

    except Exception as e:
        print("Error occurred:", traceback.format_exc())  # Log detailed error
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route('/purchasedcomponents/getyears',methods=['GET'])
def get_purchased_components_years():
    years = db.session.query(
    extract('year', PurchasedComponents.purchased_date)
    ).distinct().order_by(extract('year', PurchasedComponents.purchased_date).desc()).all()

    year_list = [year[0] for year in years if year[0] is not None]
    
    return jsonify(year_list)  

@app.route('/purchasedcomponents/get/<sort>/<year>/',methods=['GET'])
def get_purchased_components_filter_year(sort,year):
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.order_by(PurchasedComponents.purchased_date.desc()).filter(extract('year', PurchasedComponents.purchased_date) == year).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter(extract('year', PurchasedComponents.purchased_date) == year).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
                
            grouped_data = defaultdict(list)

            for item in data:
                key = (item['vendor_name'], item['purchased_date'],item['updated_date'], item['invoice_no'], item['filename'],item['supplied_to'])
                grouped_data[key].append(item)

            grouped_result = [
                {
                    "vendor_name": key[0],
                    "purchased_date": key[1],
                    "updated_date": key[2],
                    "invoice_no": key[3],
                    "filename": key[4],
                    'supplied_to':key[5],
                    "items": items
                }
                for key, items in grouped_data.items()
            ]

            return jsonify(grouped_result),200
    except:
        return '400'
    

@app.route('/purchasedcomponents/get/<sort>/',methods=['GET'])
def get_purchased_components(sort):
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
                
            grouped_data = defaultdict(list)

            for item in data:
                key = (item['vendor_name'], item['purchased_date'],item['updated_date'], item['invoice_no'], item['filename'],item['supplied_to'])
                grouped_data[key].append(item)

            grouped_result = [
                {
                    "vendor_name": key[0],
                    "purchased_date": key[1],
                    "updated_date": key[2],
                    "invoice_no": key[3],
                    "filename": key[4],
                    'supplied_to':key[5],
                    "items": items
                }
                for key, items in grouped_data.items()
            ]

            return jsonify(grouped_result),200
    except:
        return '400'
    
    
@app.route('/purchasedcomponents/get/vendornames', methods=['POST'])
def get_purchased_components_vendor_search():
    with app.app_context():
        data = request.json
        VendorName = data.get('VendorName', '')
        user_id = data.get('user_id')

        if not VendorName or not user_id:
            return jsonify({"error": "VendorName and user_id are required"}), 400

        vendors = (db.session.query(Vendors.vendor_id, Vendors.vendor_name)
                   .filter(Vendors.vendor_name.ilike(f"%{VendorName}%"), Vendors.user_id == user_id)
                   .distinct()
                   .all())

        vendor_list = [{"vendor_id": vendor.vendor_id, "vendor_name": vendor.vendor_name} for vendor in vendors]
        return jsonify(vendor_list)

    
    
@app.route('/purchasedcomponents/get/vendornames', methods=['GET'])
def get_purchased_components_vendor():
    with app.app_context():
        user_id = request.args.get('user_id')  # Retrieve user_id from query parameters

        if not user_id:
            return jsonify({"error": "user_id is required"}), 400

        vendors = (db.session.query(Vendors.vendor_id, Vendors.vendor_name)
                   .filter(Vendors.user_id == user_id)  # Filter vendors by user_id
                   .distinct()
                   .all())

        vendor_list = [{"vendor_id": vendor.vendor_id, "vendor_name": vendor.vendor_name} for vendor in vendors]
        return jsonify(vendor_list)

    

#getcomponents by vendorname
from collections import defaultdict

@app.route('/purchasedcomponents/get/components/<sort>/', methods=['PUT'])
def get_purchased_components_by_vendor(sort):
    vendor_name = preprocess(request.json.get('selectedVendor'))
    user_id=request.json.get('user_id')
    
    try:
        with app.app_context():

            # Get vendor_id from vendor_name
            vendor = Vendors.query.filter_by(vendor_name=vendor_name,user_id=user_id).first()
            if not vendor:
                print("Error: Vendor not found.")
                return '400'

            # Query purchases for this vendor_id
            query = Purchases.query.filter_by(vendor_id=vendor.vendor_id,user_id=user_id)
            if sort == 'true':
                query = query.order_by(Purchases.purchased_date.desc())
            else:
                query = query.order_by(Purchases.purchased_date)

            purchases = query.all()
            data = []

            # Process results while keeping response format same
            for p in purchases:
                data.append({
                    "purchase_id": p.purchases_id,  # Adding purchase_id
                    "vendor_name": vendor_name,
                     "vendor_id": p.vendor_id, 
                    "component_purchased": p.component.component_name,
                    "component_id": p.component_id,  # Fetch component name from Components table
                    "quantity_purchased": p.purchased_quantity,
                    "purchased_price": p.purchased_price,
                    "purchased_date": p.purchased_date,
                    "updated_date": p.updated_date,
                    "invoice_no": p.invoice_no,
                    "filename": p.invoice.invoice_pdf_name,  # Fetch filename from Invoices table
                    "supplied_to": p.supplied_to,
                    "stock_entry": p.stock_entry
                })

            # Grouping the response
            grouped_data = defaultdict(list)
            for item in data:
                key = (
                    item["vendor_name"],
                    item["purchased_date"],
                    item["updated_date"],
                    item["invoice_no"],
                    item["filename"],
                    item["supplied_to"]
                )
                grouped_data[key].append(item)

            grouped_result = [
                {
                    "vendor_name": key[0],
                    "purchased_date": key[1],
                    "updated_date": key[2],
                    "invoice_no": key[3],
                    "filename": key[4],
                    "supplied_to": key[5],
                    "items": items  # Each item now includes purchase_id
                }
                for key, items in grouped_data.items()
            ]

            return jsonify(grouped_result), 200

    except Exception as e:
        print("Error occurred:", e)
        return '400'


@app.route('/purchasedcomponents/get/componentnames', methods=['PUT'])
def get_purchased_components_component_search():
    with app.app_context():
        data = request.json
        ComponentName = data.get('ComponentName')
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        components = (db.session.query(Components.component_name)
                      .filter(Components.component_name.ilike(f"%{ComponentName}%"), 
                              Components.user_id == user_id)  # Added user_id filter
                      .distinct()
                      .all())

        components_list = [component[0] for component in components]
        return jsonify(components_list)

    
    
    
@app.route('/purchasedcomponents/get/componentnames', methods=['GET'])
def get_purchased_vendors_component():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    with app.app_context():
        components = (db.session.query(Components.component_name)
                      .filter(Components.user_id == user_id)  # Filter by user_id
                      .distinct()
                      .all())

        components_list = [component[0] for component in components]
        return jsonify(components_list)
    

@app.route('/purchasedcomponents/get/allcomponents/<sort>/', methods=['PUT'])
def get_purchased_components_by_component(sort):
    try:

        # Ensure JSON payload is received
        data = request.get_json()

        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        selected_component_purchased = data.get('selectedComponentPurchased')
        user_id = data.get('user_id')

        if not selected_component_purchased:
            return jsonify({"error": "selectedComponentPurchased is required"}), 400

        with app.app_context():
            # Get all component IDs for the given component name and user ID
            component_ids = [
                comp.component_id for comp in 
                Components.query.filter_by(component_name=selected_component_purchased, user_id=user_id).all()
            ]

            if not component_ids:
                return jsonify({"error": "Component not found"}), 404


            # Fetch purchases for all matching component IDs
            query = Purchases.query.filter(Purchases.component_id.in_(component_ids), Purchases.user_id == user_id)

            # Sorting by purchased_date
            if sort == 'true':
                query = query.order_by(Purchases.purchased_date.desc())  # Newest first
            else:
                query = query.order_by(Purchases.purchased_date.asc())   # Oldest first

            purchases = query.all()

            if not purchases:
                return jsonify({"message": "No purchases found for this component"}), 200

            # Fetch Vendor and Component details for all purchases
            vendor_ids = {purchase.vendor_id for purchase in purchases}
            vendors = {vendor.vendor_id: vendor.vendor_name for vendor in Vendors.query.filter(Vendors.vendor_id.in_(vendor_ids)).all()}

            components = {comp.component_id: comp.component_name for comp in Components.query.filter(Components.component_id.in_(component_ids)).all()}

            # Convert SQLAlchemy objects to dictionaries
            purchase_list = [
                {
                    "purchases_id": purchase.purchases_id,
                    "vendor_id": purchase.vendor_id,
                    "vendor_name": vendors.get(purchase.vendor_id, "Unknown Vendor"),
                    "component_id": purchase.component_id,
                    "purchased_component":  components.get(purchase.component_id, "Unknown Component"),
                    "invoice_no": purchase.invoice_no,
                    "stock_entry": purchase.stock_entry,
                    "purchased_quantity": purchase.purchased_quantity,
                    "purchased_price": purchase.purchased_price,
                    "purchased_date": purchase.purchased_date.strftime("%Y-%m-%d") if purchase.purchased_date else None,
                    "supplied_to": purchase.supplied_to,
                    "updated_date": purchase.updated_date.strftime("%Y-%m-%d %H:%M:%S") if purchase.updated_date else None,
                    "user_id": purchase.user_id
                }
                for purchase in purchases
            ]

            return jsonify(purchase_list), 200

    except Exception as e:
        print("Error encountered:", str(e))
        return jsonify({"error": str(e)}), 400



    
    
@app.route('/purchasedcomponents/put/invoice',methods=['PUT'])
def get_purchased_components_invoice_search():
    with app.app_context():
        Invoice=request.json.get('InvoiceInput')
        invoices = (db.session.query(Purchases.invoice_no)
                            .filter(Purchases.invoice_no.ilike(f"%{Invoice}%"))
                            .distinct()
                            .all())
        invoices_list = [invoice[0] for invoice in invoices]
        return jsonify(invoices_list)
    
    
    
@app.route('/purchasedcomponents/get/invoice', methods=['GET'])
def get_purchased_invoice_component():
    user_id = request.args.get('user_id')  # Get user_id from query parameters

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    with app.app_context():
        invoices = (db.session.query(Invoices.invoice_no)
                    .filter(Invoices.user_id == user_id)  # Filter by user_id
                    .distinct()
                    .all())

        invoices_list = [invoice[0] for invoice in invoices]
        return jsonify(invoices_list)

    
@app.route('/purchasedcomponents/get/components/invoice/<sort>/', methods=['PUT'])
def get_purchased_components_by_invoice(sort):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        invoice_no = data.get('InvoiceNo')
        user_id = data.get('user_id')

        if not invoice_no or not user_id:
            return jsonify({"error": "invoice_no and user_id are required"}), 400

        with app.app_context():
            query = db.session.query(
                Purchases, Vendors.vendor_name, Components.component_name, 
                Invoices.invoice_pdf_name, Vendors.vendor_id, Components.component_id
            ).join(Vendors, Purchases.vendor_id == Vendors.vendor_id)
            query = query.join(Components, Purchases.component_id == Components.component_id)
            query = query.join(Invoices, Purchases.invoice_no == Invoices.invoice_no)
            query = query.filter(Purchases.invoice_no == invoice_no, Purchases.user_id == user_id)

            # Sorting
            if sort == 'true':
                query = query.order_by(Purchases.purchased_date.desc())
            else:
                query = query.order_by(Purchases.purchased_date.asc())

            purchases = query.all()

            if not purchases:
                return jsonify({"message": "No purchases found for this invoice"}), 200

            data = []
            for purchase, vendor_name, component_name, invoice_pdf_name, vendor_id, component_id in purchases:
                item = {
                    "purchases_id": purchase.purchases_id,
                    "vendor_id": vendor_id,
                    "component_id": component_id,
                    "vendor_name": vendor_name,
                    "purchased_date": purchase.purchased_date.strftime("%Y-%m-%d") if purchase.purchased_date else None,
                    "updated_date": purchase.updated_date.strftime("%Y-%m-%d %H:%M:%S") if purchase.updated_date else None,
                    "invoice_no": purchase.invoice_no,
                    "invoice_pdf_name": invoice_pdf_name,
                    "supplied_to": purchase.supplied_to,
                    "component_name": component_name,
                    "purchased_quantity": purchase.purchased_quantity,
                    "purchased_price": purchase.purchased_price,
                    "stock_entry": purchase.stock_entry,
                    "user_id": purchase.user_id
                }
                data.append(item)


            # Grouping purchases by invoice details
            grouped_data = defaultdict(list)
            for item in data:
                key = (
                    item['vendor_name'], item['purchased_date'], item['updated_date'],
                    item['invoice_no'], item['invoice_pdf_name'], item['supplied_to']
                )
                grouped_data[key].append(item)

            grouped_result = [
                {
                    "vendor_name": key[0],
                    "purchased_date": key[1],
                    "updated_date": key[2],
                    "invoice_no": key[3],
                    "invoice_pdf_name": key[4],
                    "supplied_to": key[5],
                    "items": items
                }
                for key, items in grouped_data.items()
            ]


            return jsonify(grouped_result), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Something went wrong"}), 400



@app.route('/purchasedcomponents/put/suppliedto', methods=['PUT'])
def get_purchased_components_suppliedto_search():
    try:
        SuppliedTo = request.json.get('SuppliedToInput', '')  # Default to empty string
        user_id = request.json.get('user_id')
        user_id = int(user_id)  # Convert to integer

        with app.app_context():
            query = db.session.query(Purchases.supplied_to).filter(Purchases.user_id == user_id)

            # Apply `ilike` filter only if SuppliedTo is not empty
            if SuppliedTo:
                query = query.filter(Purchases.supplied_to.ilike(f"%{SuppliedTo}%"))

            supplies = query.distinct().all()
            supplies_list = [supplie[0] for supplie in supplies]

            return jsonify(supplies_list), 200

    except ValueError:
        return jsonify({"error": "Invalid user_id"}), 400
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": "Something went wrong"}), 500

    
    
    
@app.route('/purchasedcomponents/get/suppliedto', methods=['GET'])
def get_purchased_suppliedto_component():
    user_id = request.args.get('user_id')
    try:
        user_id = int(user_id)  # Convert user_id to an integer

        with app.app_context():
            supplies = (
                db.session.query(Purchases.supplied_to)
                .filter(Purchases.user_id == user_id)  # Correct filtering
                .distinct()
                .all()
            )

            supplies_list = [supplie[0] for supplie in supplies]
            return jsonify(supplies_list), 200

    except ValueError:
        return jsonify({"error": "Invalid user_id"}), 400

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": "Something went wrong"}), 500


#get components by suppliedto
@app.route('/purchasedcomponents/get/components/suppliedto/<sort>/', methods=['PUT'])
def get_purchased_components_by_suppliedto(sort):
    try:

        data = request.get_json()

        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        supplied_to = data.get('SuppliedTo')
        user_id = data.get('user_id')

        if not supplied_to or not user_id:
            return jsonify({"error": "SuppliedTo and user_id are required"}), 400

        with app.app_context():
            query = db.session.query(
                Purchases, Vendors.vendor_name, Components.component_name, 
                Invoices.invoice_pdf_name, Vendors.vendor_id, Components.component_id
            ).join(Vendors, Purchases.vendor_id == Vendors.vendor_id)
            query = query.join(Components, Purchases.component_id == Components.component_id)
            query = query.join(Invoices, Purchases.invoice_no == Invoices.invoice_no)
            query = query.filter(Purchases.supplied_to == supplied_to, Purchases.user_id == user_id)

            # Sorting
            if sort == 'true':
                query = query.order_by(Purchases.purchased_date.desc())
            else:
                query = query.order_by(Purchases.purchased_date.asc())

            purchases = query.all()

            if not purchases:
                return jsonify({"message": "No purchases found for this supplied_to"}), 200

            data = []
            for purchase, vendor_name, component_name, invoice_pdf_name, vendor_id, component_id in purchases:
                item = {
                    "purchases_id": purchase.purchases_id,
                    "vendor_id": vendor_id,
                    "component_id": component_id,
                    "vendor_name": vendor_name,
                    "purchased_date": purchase.purchased_date.strftime("%Y-%m-%d") if purchase.purchased_date else None,
                    "updated_date": purchase.updated_date.strftime("%Y-%m-%d %H:%M:%S") if purchase.updated_date else None,
                    "invoice_no": purchase.invoice_no,
                    "invoice_pdf_name": invoice_pdf_name,
                    "supplied_to": purchase.supplied_to,
                    "component_name": component_name,
                    "purchased_quantity": purchase.purchased_quantity,
                    "purchased_price": purchase.purchased_price,
                    "stock_entry": purchase.stock_entry,
                    "user_id": purchase.user_id
                }
                data.append(item)

            # Grouping purchases by supplied_to details
            grouped_data = defaultdict(list)
            for item in data:
                key = (
                    item['vendor_name'], item['purchased_date'], item['updated_date'],
                    item['invoice_no'], item['invoice_pdf_name'], item['supplied_to']
                )
                grouped_data[key].append(item)

            grouped_result = [
                {
                    "vendor_name": key[0],
                    "purchased_date": key[1],
                    "updated_date": key[2],
                    "invoice_no": key[3],
                    "invoice_pdf_name": key[4],
                    "supplied_to": key[5],
                    "items": items
                }
                for key, items in grouped_data.items()
            ]

            return jsonify(grouped_result), 200

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": "Something went wrong"}), 400
    
    

@app.route('/get/options', methods=['GET'])
def get_options_for_supplied_to():
    dept = [
        'IT Department', 'CSE Department', 'AE Department', 'CS-AIML Department', 
        'CS-DS Department', 'CS-IoT Department', 'CS-CYS Department', 'CSBS Department', 
        'CE Department', 'ECE Department', 'EEE Department', 'EIE Department', 'ME Department'
    ]
    return jsonify(dept)


## new route for generating pdf

@app.route('/vendor/generate_pdf/<sort>/', methods=['POST'])
def generate_pdf_vendor(sort):
    vendor_name = request.json.get('selectedVendor')
    user_id = request.json.get('user_id')

    try:
        with app.app_context():
            # Fetch vendor_id from Vendors table
            vendor = Vendors.query.filter_by(vendor_name=vendor_name,user_id=user_id).first()
            if not vendor:
                return jsonify({"error": "Vendor not found"}), 404  

            vendor_id = vendor.vendor_id

            # Fetch purchases using vendor_id and user_id
            if sort == 'true':
                purchases = Purchases.query.filter_by(vendor_id=vendor_id, user_id=user_id).order_by(Purchases.purchased_date.desc()).all()
            else:
                purchases = Purchases.query.filter_by(vendor_id=vendor_id, user_id=user_id).order_by(Purchases.purchased_date).all()

            if not purchases:
                return jsonify({"error": "No purchases found"}), 404  

            data = [
                {
                    "component_purchased": purchase.component.component_name,  
                    "purchased_price": purchase.purchased_price,
                    "purchased_quantity": purchase.purchased_quantity,
                    "invoice_no": purchase.invoice_no,
                    "supplied_to": purchase.supplied_to,
                    "stock_entry": purchase.stock_entry,
                    "purchased_date": purchase.purchased_date.strftime('%Y-%m-%d'),
                    "updated_date": purchase.updated_date.strftime('%Y-%m-%d %H:%M:%S'),
                }
                for purchase in purchases
            ]

        # Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times", style='BI', size=15)
        pdf.cell(200, 15, txt=f"{vendor_name} Vendor Report", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())

        c = 0
        for i in data:
            if c % 5 == 0 and c != 0:
                pdf.set_font("Times", style='BI', size=15)
                pdf.cell(200, 15, txt=f"{vendor_name} Vendor Report", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)

            pdf.cell(200, 10, txt=f"Component Purchased: {i['component_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price: {i['purchased_price']} rs, Quantity Purchased: {i['purchased_quantity']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No.: {i['invoice_no']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To: {i['supplied_to']}, Stock Entry: {i['stock_entry']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date: {i['purchased_date']}, Updated date: {i['updated_date']}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())

            c += 1

        # Send the PDF response
        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)

        filename = f"{vendor_name} report.pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    
    
@app.route('/component/generate_pdf/<sort>/', methods=['POST'])
def generate_pdf_component(sort):
    selected_component_name = request.json.get('selectedComponentPurchased')
    user_id = request.json.get('user_id')
    
    try:
        with app.app_context():
            component = Components.query.filter_by(component_name=selected_component_name, user_id=user_id).first()
            if not component:
                return "Component not found", 404

            component_id = component.component_id
            
            if sort == 'true':
                purchases = Purchases.query.filter_by(component_id=component_id,user_id=user_id).order_by(Purcases.purchased_date.desc()).all()
            else:
                purchases = Purchases.query.filter_by(component_id=component_id,user_id=user_id).order_by(Purchases.purchased_date).all()
            
            vendor_ids = {purchase.vendor_id for purchase in purchases}
            vendors = {vendor.vendor_id: vendor.vendor_name for vendor in Vendors.query.filter(Vendors.vendor_id.in_(vendor_ids)).all()}
            
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times", style='BI', size=15)
        pdf.cell(200, 15, txt=f"{selected_component_name} Component Report", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        
        c = 0
        for purchase in purchases:
            if c % 5 == 0 and c != 0:
                pdf.set_font("Times", style='BI', size=15)
                pdf.cell(200, 15, txt=f"{selected_component_name} Component Report", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            
            vendor_name = vendors.get(purchase.vendor_id, "Unknown Vendor")
            pdf.cell(200, 10, txt=f"Vendor Name : {vendor_name}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {purchase.purchased_price} rs, Quantity Purchased : {purchase.purchased_quantity}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {purchase.invoice_no}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To : {purchase.supplied_to}, Stock Entry : {purchase.stock_entry}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date : {purchase.purchased_date}, Updated Date : {purchase.updated_date.strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c += 1
      
        # Send the PDF response
        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)

        filename = f"{vendor_name} report.pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": str(e)}), 400



@app.route('/invoice/generate_pdf/<sort>/', methods=['POST'])
def generate_pdf_invoice(sort):
    InvoiceNo = request.json.get('InvoiceNo')
    user_id = request.json.get('user_id')
    
    try:
        with app.app_context():
            if sort == 'true':
                purchases = Purchases.query.filter_by(invoice_no=InvoiceNo, user_id=user_id).order_by(Purchases.purchased_date.desc()).all()
            else:
                purchases = Purchases.query.filter_by(invoice_no=InvoiceNo, user_id=user_id).order_by(Purchases.purchased_date).all()

            if not purchases:
                return jsonify({"error": "No purchases found"}), 404  

            data = [
                {
                    "component_purchased": purchase.component.component_name,  
                    "vendor_name":purchase.vendor.vendor_name,
                    "purchased_price": purchase.purchased_price,
                    "purchased_quantity": purchase.purchased_quantity,
                    "invoice_no": purchase.invoice_no,
                    "supplied_to": purchase.supplied_to,
                    "stock_entry": purchase.stock_entry,
                    "purchased_date": purchase.purchased_date.strftime('%Y-%m-%d'),
                    "updated_date": purchase.updated_date.strftime('%Y-%m-%d %H:%M:%S'),
                }
                for purchase in purchases
            ]

        # Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times", style='BI', size=15)
        pdf.cell(200, 15, txt=f"{InvoiceNo} Invoice Report", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())

        c = 0
        for i in data:
            if c % 5 == 0 and c != 0:
                pdf.set_font("Times", style='BI', size=15)
                pdf.cell(200, 15, txt=f"{InvoiceNo} Invoice Report", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)

            pdf.cell(200, 10, txt=f"Component Purchased: {i['component_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Vendor name: {i['vendor_name']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price: {i['purchased_price']} rs, Quantity Purchased: {i['purchased_quantity']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No.: {i['invoice_no']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To: {i['supplied_to']}, Stock Entry: {i['stock_entry']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date: {i['purchased_date']}, Updated date: {i['updated_date']}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())

            c += 1

        # Send the PDF response
        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)

        filename = f"{InvoiceNo} report.pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": str(e)}), 400  

    
    
@app.route('/suppliedto/generate_pdf/<sort>/', methods=['POST'])
def generate_pdf_suppliedto(sort):
    suppliedTo=request.json.get('SuppliedTo')
    user_id=request.json.get('user_id')
    try:
        with app.app_context():
            if sort == 'true':
                purchases = Purchases.query.filter_by(supplied_to=suppliedTo, user_id=user_id).order_by(Purchases.purchased_date.desc()).all()
            else:
                purchases = Purchases.query.filter_by(supplied_to=suppliedTo, user_id=user_id).order_by(Purchases.purchased_date).all()

            if not purchases:
                return jsonify({"error": "No purchases found"}), 404  

            data = [
                {
                    "component_purchased": purchase.component.component_name,  
                    "vendor_name":purchase.vendor.vendor_name,
                    "purchased_price": purchase.purchased_price,
                    "purchased_quantity": purchase.purchased_quantity,
                    "invoice_no": purchase.invoice_no,
                    "supplied_to": purchase.supplied_to,
                    "stock_entry": purchase.stock_entry,
                    "purchased_date": purchase.purchased_date.strftime('%Y-%m-%d'),
                    "updated_date": purchase.updated_date.strftime('%Y-%m-%d %H:%M:%S'),
                }
                for purchase in purchases
            ]

        # Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times", style='BI', size=15)
        pdf.cell(200, 15, txt=f"{suppliedTo} Report", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())

        c = 0
        for i in data:
            if c % 5 == 0 and c != 0:
                pdf.set_font("Times", style='BI', size=15)
                pdf.cell(200, 15, txt=f"{suppliedTo} Report", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)

            pdf.cell(200, 10, txt=f"Component Purchased: {i['component_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Vendor name: {i['vendor_name']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price: {i['purchased_price']} rs, Quantity Purchased: {i['purchased_quantity']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No.: {i['invoice_no']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To: {i['supplied_to']}, Stock Entry: {i['stock_entry']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date: {i['purchased_date']}, Updated date: {i['updated_date']}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())

            c += 1

        # Send the PDF response
        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)

        filename = f"{suppliedTo} report.pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": str(e)}), 400  
    
    
def add_commas_indian_format(number):
    num_str = str(number)[::-1]
    parts = []
    parts.append(num_str[:3])
    num_str = num_str[3:]
    while num_str:
        parts.append(num_str[:2])
        num_str = num_str[2:]
    return ','.join(parts)[::-1]
    

@app.route('/home', methods=['GET'])
def home_display():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        # Fetch all purchases for the given user
        purchases = Purchases.query.filter_by(user_id=user_id).all()

        total_amount = 0
        total_components = 0
        vendor_ids = set()
        component_ids = set()

        for purchase in purchases:
            total_amount += int(purchase.purchased_price)
            total_components += int(purchase.purchased_quantity)
            vendor_ids.add(purchase.vendor_id)
            component_ids.add(purchase.component_id)

        data = {
            "initialamount": total_amount,
            "totalamount": int(1.18 * total_amount),
            "cgst": int(0.09 * total_amount),
            "sgst": int(0.09 * total_amount),
            "totalcomponents": total_components,
            "totalvendors": len(vendor_ids),
            "uniquecomponents": len(component_ids),
        }

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get/component/date/<sort>/', methods=['PUT'])
def get_component_by_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    component_name = request.json.get('Component')
    user_id = request.json.get('user_id')
    
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            
            # Get component IDs matching the component name and user_id
            component_ids = [
                comp.component_id for comp in 
                Components.query.filter_by(component_name=component_name, user_id=user_id).all()
            ]
            
            if not component_ids:
                return jsonify({"error": "Component not found"}), 404
            
            # Query purchases within the date range for the component IDs
            query = Purchases.query.filter(
                Purchases.purchased_date >= from_date,
                Purchases.purchased_date <= to_date,
                Purchases.component_id.in_(component_ids),
                Purchases.user_id == user_id
            )
            
            if sort == 'true':
                query = query.order_by(Purchases.purchased_date.desc())
            else:
                query = query.order_by(Purchases.purchased_date.asc())
            
            purchases = query.all()
            
            if not purchases:
                return jsonify({"message": "No purchases found for this component within the given date range"}), 200
            
            # Fetch Vendor and Invoice details
            vendor_ids = {purchase.vendor_id for purchase in purchases}
            invoice_nos = {purchase.invoice_no for purchase in purchases}
            
            vendors = {vendor.vendor_id: vendor.vendor_name for vendor in Vendors.query.filter(Vendors.vendor_id.in_(vendor_ids)).all()}
            invoices = {invoice.invoice_no: invoice.invoice_pdf_name for invoice in Invoices.query.filter(Invoices.invoice_no.in_(invoice_nos)).all()}
            
            # Process and group data
            data = []
            for p in purchases:
                data.append({
                    "purchase_id": p.purchases_id,
                    "vendor_name": vendors.get(p.vendor_id, "Unknown Vendor"),
                    "vendor_id": p.vendor_id,
                    "component_purchased": component_name,
                    "component_id": p.component_id,
                    "quantity_purchased": p.purchased_quantity,
                    "purchased_price": p.purchased_price,
                    "purchased_date": p.purchased_date,
                    "updated_date": p.updated_date,
                    "invoice_no": p.invoice_no,
                    "filename": invoices.get(p.invoice_no, "Unknown Invoice"),
                    "supplied_to": p.supplied_to,
                    "stock_entry": p.stock_entry
                })
            
            grouped_data = defaultdict(list)
            for item in data:
                key = (
                    item["vendor_name"],
                    item["purchased_date"],
                    item["updated_date"],
                    item["invoice_no"],
                    item["filename"],
                    item["supplied_to"]
                )
                grouped_data[key].append(item)
            
            grouped_result = [
                {
                    "vendor_name": key[0],
                    "purchased_date": key[1],
                    "updated_date": key[2],
                    "invoice_no": key[3],
                    "filename": key[4],
                    "supplied_to": key[5],
                    "items": items
                }
                for key, items in grouped_data.items()
            ]
            
            return jsonify(grouped_result), 200
    
    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": str(e)}), 400

    
@app.route('/get/vendor/date/<sort>/', methods=['PUT'])
def get_vendor_by_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    vendor_name = request.json.get('Vendor')
    user_id = request.json.get('user_id')
    
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            
            # Find vendor ID based on vendor name and user_id
            vendor = Vendors.query.filter_by(vendor_name=vendor_name, user_id=user_id).first()
            
            if not vendor:
                return jsonify({"error": "Vendor not found"}), 404
            
            # Query purchases within the date range for the found vendor
            query = Purchases.query.filter(
                Purchases.purchased_date >= from_date,
                Purchases.purchased_date <= to_date,
                Purchases.vendor_id == vendor.vendor_id,
                Purchases.user_id == user_id
            )
            
            if sort == 'true':
                query = query.order_by(Purchases.purchased_date.desc())
            else:
                query = query.order_by(Purchases.purchased_date.asc())
            
            purchases = query.all()
            
            if not purchases:
                return jsonify({"message": "No purchases found for this vendor within the given date range"}), 200
            
            # Fetch invoice details
            invoice_nos = {p.invoice_no for p in purchases}
            invoices = {inv.invoice_no: inv.invoice_pdf_name for inv in Invoices.query.filter(Invoices.invoice_no.in_(invoice_nos)).all()}
            
            # Process and structure data
            data = []
            for p in purchases:
                data.append({
                    "purchase_id": p.purchases_id,
                    "vendor_name": vendor_name,
                    "vendor_id": p.vendor_id,
                    "component_purchased": p.component.component_name,
                    "component_id": p.component_id,
                    "quantity_purchased": p.purchased_quantity,
                    "purchased_price": p.purchased_price,
                    "purchased_date": p.purchased_date,
                    "updated_date": p.updated_date,
                    "invoice_no": p.invoice_no,
                    "filename": invoices.get(p.invoice_no, "Unknown Invoice"),
                    "supplied_to": p.supplied_to,
                    "stock_entry": p.stock_entry
                })
            
            grouped_data = defaultdict(list)
            for item in data:
                key = (
                    item["vendor_name"],
                    item["purchased_date"],
                    item["updated_date"],
                    item["invoice_no"],
                    item["filename"],
                    item["supplied_to"]
                )
                grouped_data[key].append(item)
            
            grouped_result = [
                {
                    "vendor_name": key[0],
                    "purchased_date": key[1],
                    "updated_date": key[2],
                    "invoice_no": key[3],
                    "filename": key[4],
                    "supplied_to": key[5],
                    "items": items
                }
                for key, items in grouped_data.items()
            ]
            
            return jsonify(grouped_result), 200
    
    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": str(e)}), 400



@app.route('/get/suppliedto/date/<sort>/', methods=['PUT'])
def get_suppliedto_by_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    supplied_to = request.json.get('SuppliedTo')
    user_id = request.json.get('user_id')
    
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            
            query = Purchases.query.filter(
                Purchases.purchased_date >= from_date,
                Purchases.purchased_date <= to_date,
                Purchases.supplied_to == supplied_to,
                Purchases.user_id == user_id
            )
            
            if sort == 'true':
                query = query.order_by(Purchases.purchased_date.desc())
            else:
                query = query.order_by(Purchases.purchased_date.asc())
            
            purchases = query.all()
            
            if not purchases:
                return jsonify({"message": "No purchases found for the given supplied_to within the date range"}), 200
            
            vendor_ids = {purchase.vendor_id for purchase in purchases}
            invoice_nos = {purchase.invoice_no for purchase in purchases}
            
            vendors = {vendor.vendor_id: vendor.vendor_name for vendor in Vendors.query.filter(Vendors.vendor_id.in_(vendor_ids)).all()}
            invoices = {invoice.invoice_no: invoice.invoice_pdf_name for invoice in Invoices.query.filter(Invoices.invoice_no.in_(invoice_nos)).all()}
            
            data = []
            for p in purchases:
                data.append({
                    "purchase_id": p.purchases_id,
                    "vendor_name": vendors.get(p.vendor_id, "Unknown Vendor"),
                    "vendor_id": p.vendor_id,
                    "component_purchased": p.component.component_name,
                    "component_id": p.component_id,
                    "quantity_purchased": p.purchased_quantity,
                    "purchased_price": p.purchased_price,
                    "purchased_date": p.purchased_date,
                    "updated_date": p.updated_date,
                    "invoice_no": p.invoice_no,
                    "filename": invoices.get(p.invoice_no, "Unknown Invoice"),
                    "supplied_to": p.supplied_to,
                    "stock_entry": p.stock_entry
                })
            
            grouped_data = defaultdict(list)
            for item in data:
                key = (
                    item["vendor_name"],
                    item["purchased_date"],
                    item["updated_date"],
                    item["invoice_no"],
                    item["filename"],
                    item["supplied_to"]
                )
                grouped_data[key].append(item)
            
            grouped_result = [
                {
                    "vendor_name": key[0],
                    "purchased_date": key[1],
                    "updated_date": key[2],
                    "invoice_no": key[3],
                    "filename": key[4],
                    "supplied_to": key[5],
                    "items": items
                }
                for key, items in grouped_data.items()
            ]
            
            return jsonify(grouped_result), 200
    
    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": str(e)}), 400

    
    
@app.route('/component/generate_pdf/date/<sort>/', methods=['POST'])
def generate_pdf_component_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    Component = request.json.get('Component')
    user_id = request.json.get('user_id')

    try:
        with app.app_context():
            # Convert date strings to date objects
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            
            # Fetch component details
            component = Components.query.filter_by(component_name=Component, user_id=user_id).first()
            if not component:
                return jsonify({"error": "Component not found"}), 404
            
            component_id = component.component_id

            # Query purchases
            if sort == 'true':
                purchases = Purchases.query.filter(
                    and_(
                        Purchases.component_id == component_id,
                        Purchases.user_id == user_id,
                        Purchases.purchased_date >= from_date,
                        Purchases.purchased_date <= to_date
                    )
                ).order_by(Purchases.purchased_date.desc()).all()
            else:
                purchases = Purchases.query.filter(
                    Purchases.component_id == component_id,
                    Purchases.user_id == user_id,
                    Purchases.purchased_date >= from_date,
                    Purchases.purchased_date <= to_date
                ).order_by(Purchases.purchased_date).all()


            # Fetch vendor details
            vendor_ids = {purchase.vendor_id for purchase in purchases}
            vendors = {vendor.vendor_id: vendor.vendor_name for vendor in Vendors.query.filter(Vendors.vendor_id.in_(vendor_ids)).all()}

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times", style='BI', size=15)
        pdf.cell(200, 15, txt=f"{Component} Component Report", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        
        c = 0
        for purchase in purchases:
            if c % 5 == 0 and c != 0:
                pdf.set_font("Times", style='BI', size=15)
                pdf.cell(200, 15, txt=f"{Component} Component Report", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            
            vendor_name = vendors.get(purchase.vendor_id, "Unknown Vendor")
            pdf.cell(200, 10, txt=f"Vendor Name : {vendor_name}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {purchase.purchased_price} rs, Quantity Purchased : {purchase.purchased_quantity}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {purchase.invoice_no}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To : {purchase.supplied_to}, Stock Entry : {purchase.stock_entry}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date : {purchase.purchased_date}, Updated Date : {purchase.updated_date.strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c += 1
      
        # Send the PDF response
        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)

        filename = f"{Component} report.pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": str(e)}), 400
           

@app.route('/vendor/generate_pdf/date/<sort>/', methods=['POST'])
def generate_pdf_vendor_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    vendor_name = request.json.get('Vendor')
    user_id = request.json.get('user_id')

    try:
        with app.app_context():
            # Convert date strings to date objects
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()

            # Fetch vendor details
            vendor = Vendors.query.filter_by(vendor_name=vendor_name, user_id=user_id).first()
            if not vendor:
                return jsonify({"error": "Vendor not found"}), 404

            vendor_id = vendor.vendor_id

            # Query purchases
            if sort == 'true':
                purchases = Purchases.query.filter(
                    and_(
                        Purchases.vendor_id == vendor_id,
                        Purchases.user_id == user_id,
                        Purchases.purchased_date >= from_date,
                        Purchases.purchased_date <= to_date
                    )
                ).order_by(Purchases.purchased_date.desc()).all()
            else:
                purchases = Purchases.query.filter(
                    Purchases.vendor_id == vendor_id,
                    Purchases.user_id == user_id,
                    Purchases.purchased_date >= from_date,
                    Purchases.purchased_date <= to_date
                ).order_by(Purchases.purchased_date).all()


            # Fetch additional details: Component Names & Vendor Names
            component_ids = {purchase.component_id for purchase in purchases}
            invoice_nos = {purchase.invoice_no for purchase in purchases}

            components = {c.component_id: c.component_name for c in Components.query.filter(Components.component_id.in_(component_ids)).all()}
            invoices = {invoice.invoice_no: invoice.invoice_pdf_name for invoice in Invoices.query.filter(Invoices.invoice_no.in_(invoice_nos)).all()}

        # Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times", style='BI', size=15)
        pdf.cell(200, 15, txt=f"{vendor_name} Vendor Report", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())

        c = 0
        for purchase in purchases:
            if c % 5 == 0 and c != 0:
                pdf.set_font("Times", style='BI', size=15)
                pdf.cell(200, 15, txt=f"{vendor_name} Vendor Report", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)

            component_name = components.get(purchase.component_id, "Unknown Component")
            invoice_name = invoices.get(purchase.invoice_no, "No Invoice")

            pdf.cell(200, 10, txt=f"Component Purchased : {component_name}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {purchase.purchased_price} rs, Quantity Purchased : {purchase.purchased_quantity}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {purchase.invoice_no}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To : {purchase.supplied_to}, Stock Entry : {purchase.stock_entry}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date : {purchase.purchased_date}, Updated Date : {purchase.updated_date.strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c += 1

        # Send the PDF response
        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)

        filename = f"{vendor_name} Vendor Report.pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    
 
@app.route('/suppliedto/generate_pdf/date/<sort>/', methods=['POST'])
def generate_pdf_suppliedto_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    supplied_to = request.json.get('SuppliedTo')
    user_id = request.json.get('user_id') 

    try:
        with app.app_context():
            # Convert date strings to datetime objects
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()

            # Fetch purchase data based on `supplied_to`, `user_id`, and date interval
            if sort == 'true':
                purchases = Purchases.query.filter(
                    Purchases.supplied_to == supplied_to,
                    Purchases.user_id == user_id,
                    Purchases.purchased_date >= from_date,
                    Purchases.purchased_date <= to_date
                ).order_by(Purchases.purchased_date.desc()).all()
            else:
                purchases = Purchases.query.filter(
                    Purchases.supplied_to == supplied_to,
                    Purchases.user_id == user_id,
                    Purchases.purchased_date >= from_date,
                    Purchases.purchased_date <= to_date
                ).order_by(Purchases.purchased_date).all()


            # Fetch related data: Vendor Names, Component Names, Invoice PDFs
            vendor_ids = {purchase.vendor_id for purchase in purchases}
            component_ids = {purchase.component_id for purchase in purchases}
            invoice_nos = {purchase.invoice_no for purchase in purchases}

            vendors = {v.vendor_id: v.vendor_name for v in Vendors.query.filter(Vendors.vendor_id.in_(vendor_ids)).all()}
            components = {c.component_id: c.component_name for c in Components.query.filter(Components.component_id.in_(component_ids)).all()}
            invoices = {i.invoice_no: i.invoice_pdf_name for i in Invoices.query.filter(Invoices.invoice_no.in_(invoice_nos)).all()}

        # Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times", style='BI', size=15)
        pdf.cell(200, 15, txt=f"Report on Components Supplied to {supplied_to}", ln=True, align='L')
        pdf.cell(200, 15, txt=f"(From {from_date} to {to_date})", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())

        c = 0
        for purchase in purchases:
            if c % 5 == 0 and c != 0:
                pdf.add_page()
                pdf.set_font("Times", style='BI', size=15)
                pdf.cell(200, 15, txt=f"Report on Components Supplied to {supplied_to}", ln=True, align='L')
                pdf.cell(200, 15, txt=f"(From {from_date} to {to_date})", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)

            vendor_name = vendors.get(purchase.vendor_id, "Unknown Vendor")
            component_name = components.get(purchase.component_id, "Unknown Component")
            invoice_name = invoices.get(purchase.invoice_no, "No Invoice")

            pdf.cell(200, 10, txt=f"Vendor Name : {vendor_name}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Component Purchased : {component_name}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {purchase.purchased_price} rs, Quantity Purchased : {purchase.purchased_quantity}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {purchase.invoice_no}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Stock Entry : {purchase.stock_entry}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date : {purchase.purchased_date}, Updated Date : {purchase.updated_date.strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align='L')
            pdf.set_font("Times", size=12)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())

            c += 1

        # Send the PDF response
        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)

        filename = f"Report on Components Supplied to {supplied_to} (from {from_date} to {to_date}).pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

    except Exception as e:
        print("Error occurred:", e)
        return jsonify({"error": str(e)}), 400


    
    
@app.route('/get/component/options', methods=['PUT'])
def get_options_component_search():
    FromDate = request.json.get('FromDate')
    ToDate = request.json.get('ToDate')
    user_id = request.json.get('user_id')

    query = db.session.query(Purchases.component_id).distinct()

    # Apply filters for date range and user_id
    if FromDate and ToDate:
        query = query.filter(
            Purchases.purchased_date >= FromDate,
            Purchases.purchased_date <= ToDate
        )
    
    if user_id:
        query = query.filter(Purchases.user_id == user_id)

    component_ids = [component[0] for component in query.all()]

    # Fetch distinct component names based on component_ids
    component_names = (
        db.session.query(Components.component_name)
        .filter(Components.component_id.in_(component_ids))
        .distinct()
        .all()
    )

    component_names_list = list(set(component[0] for component in component_names))  # Ensure uniqueness

    return jsonify(component_names_list)


    
    

@app.route('/get/vendor/options', methods=['PUT'])
def get_options_vendor_search():
    with app.app_context():
        FromDate = request.json.get('FromDate')
        ToDate = request.json.get('ToDate')
        user_id = request.json.get('user_id')  # Get user_id from request

        # Query to get distinct vendor_ids from Purchases within the given date range and matching user_id
        query = db.session.query(Purchases.vendor_id).distinct()

        if FromDate and ToDate:
            query = query.filter(
                Purchases.purchased_date >= FromDate,
                Purchases.purchased_date <= ToDate
            )

        if user_id:  # Apply user_id filter only if provided
            query = query.filter(Purchases.user_id == user_id)

        vendor_ids = [vendor[0] for vendor in query.all()]

        # Fetch vendor names using vendor_ids from the Vendors table
        vendor_names = (
            db.session.query(Vendors.vendor_name)
            .filter(Vendors.vendor_id.in_(vendor_ids))
            .all()
        )

        vendor_names_list = [vendor[0] for vendor in vendor_names]

        return jsonify(vendor_names_list)

    
    
    
@app.route('/get/suppliedto/options', methods=['PUT'])
def get_options_suppliedto_search():
    with app.app_context():
        FromDate = request.json.get('FromDate')
        ToDate = request.json.get('ToDate')
        user_id = request.json.get('user_id')  # Get user_id from request

        query = db.session.query(Purchases.supplied_to, Purchases.purchased_date).distinct()

        if FromDate and ToDate:
            query = query.filter(
                Purchases.purchased_date >= FromDate,
                Purchases.purchased_date <= ToDate
            )

        if user_id:  # Apply user_id filter only if provided
            query = query.filter(Purchases.user_id == user_id)

        supplies = query.order_by(Purchases.purchased_date).all()
        supplies_list = [supplie[0] for supplie in supplies]  # Extract `supplied_to`

        return jsonify(supplies_list)


# ------------------- Register User Route -------------------

@app.route('/signup', methods=['POST'])
def register_user():
    try:
        data = request.json  
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')

        if not email or not username or not password:
            return jsonify({"error": "Email, Username, and Password are required"}), 400

        # Validate username (only letters, at least 7 characters)
        if not re.match("^[A-Za-z]{7,}$", username):  
            return jsonify({"error": "Username must be at least 7 characters and contain only letters"}), 400

        # Check if email or username already exists
        existing_user = RegisteredUsers.query.filter(
            (RegisteredUsers.email == email) | (RegisteredUsers.username == username)
        ).first()

        if existing_user:
            if existing_user.email == email:
                return jsonify({"error": "User with this email already exists"}), 400
            else:
                return jsonify({"error": "Username is already taken"}), 400

        # Hash the password
        hashed_password = generate_password_hash(password)

        # Create new user
        new_user = RegisteredUsers(email=email, username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully!"}), 201

    except Exception as e:
       print("Error in /signup:", str(e))  # Logs the error
       return jsonify({"error": "Internal Server Error"}), 500



@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email and Password are required"}), 400

        # Use SQLAlchemy to fetch the user
        user = RegisteredUsers.query.filter_by(email=email).first()

        if user is None:
            return jsonify({"message": "User with this email does not exist"}), 404

        # Verify the hashed password
        if not check_password_hash(user.password, password):
            return jsonify({"message": "Wrong password"}), 401

        return jsonify({
            "message": "Login successful ✅",
            "user": {
                "user_id":user.user_id,
                "email": user.email,
                "username": user.username
            }
        }), 200

    except Exception as e:
       print("Error in /login:", str(e))  # Logs the error
       return jsonify({"error": "Internal Server Error"}), 500


if __name__=='__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug = True)