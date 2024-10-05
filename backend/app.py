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
import io

app=Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql://root:@127.0.0.1/ComponentsPurchased"
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
CORS(app)
db=SQLAlchemy(app)
ma=Marshmallow(app)

class PurchasedComponents(db.Model):
    __tablename__ = 'PurchasedComponents'

    id = db.Column(db.Integer, db.Sequence('user_id_seq'), primary_key=True)
    vendor_name = db.Column(db.String(100))
    component_purchased = db.Column(db.String(100))
    quantity_purchased = db.Column(db.Integer)
    purchased_price = db.Column(db.Float)
    purchased_date = db.Column(db.Date)
    stock_entry = db.Column(db.String(50))
    invoice_no = db.Column(db.String(50))
    updated_date=db.Column(db.DateTime,default=datetime.datetime.now)
    filename = db.Column(db.String(100), nullable=False)
    supplied_to = db.Column(db.String(100), nullable=False)

    def __init__(self, vendor_name, component_purchased, quantity_purchased, purchased_price, purchased_date, stock_entry, invoice_no,filename,supplied_to):
        self.vendor_name = vendor_name
        self.component_purchased = component_purchased
        self.quantity_purchased = quantity_purchased
        self.purchased_price = purchased_price
        self.purchased_date = purchased_date
        self.stock_entry = stock_entry
        self.invoice_no = invoice_no
        self.filename = filename
        self.supplied_to = supplied_to


class PurchasedComponentsSchema(ma.Schema):
    class Meta:
        fields = ('id', 'vendor_name', 'component_purchased', 'quantity_purchased', 'purchased_price', 'purchased_date', 'stock_entry', 'invoice_no','updated_date','filename','supplied_to')

purchased_component_schema = PurchasedComponentsSchema()
purchased_components_schema = PurchasedComponentsSchema(many=True)

def preprocess(string):
    string=string.rstrip()
    string=string.lower()
    string=string.title()
    return string



with app.app_context():
    db.create_all()

   
    
    
@app.route('/purchasedcomponents/postall',methods=['POST'])
def postall_purchased_components():
    try:
        with app.app_context():
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No selected file"}), 400

            if file and file.filename.endswith('.pdf'):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                vendor=preprocess(request.form.get('vendor'))
                PurchasedDate=preprocess(request.form.get('PurchasedDate'))
                InvoiceNo=preprocess(request.form.get('InvoiceNo'))
                suppliedTo=request.form.get('suppliedTo')
                print(suppliedTo)
                components=request.form.get('components')
                components = json.loads(components) if components else []
                for i in components:
                    selectedComponentPurchased=preprocess(i['selectedComponentPurchased'])
                    QuantityPurchased=i['QuantityPurchased']
                    PurchasedPrice=i['PurchasedPrice']
                    StockEntry=i['StockEntry']
                    row=PurchasedComponents(vendor,selectedComponentPurchased,QuantityPurchased,PurchasedPrice,PurchasedDate,StockEntry,InvoiceNo,filename,suppliedTo)
                    db.session.add(row)
                    db.session.commit()
                return '201'
            else:
                return '400'
    except:
        return '400'
    
    
    
@app.route('/purchasedcomponents/put',methods=['PUT'])
def put_purchased_components():
    try:
        with app.app_context():
            id=request.json.get('id')
            selectedVendor=preprocess(request.json.get('selectedVendor'))
            selectedComponentPurchased=preprocess(request.json.get('selectedComponentPurchased'))
            QuantityPurchased=(request.json.get('QuantityPurchased'))
            PurchasedPrice=(request.json.get('PurchasedPrice'))
            PurchasedDate=(request.json.get('PurchasedDate'))
            StockEntry=(request.json.get('StockEntry'))
            InvoiceNo=(request.json.get('InvoiceNo'))
            s=PurchasedComponents.query.filter_by(id=id).first()
            s.vendor_name=selectedVendor
            s.component_purchased=selectedComponentPurchased
            s.quantity_purchased=QuantityPurchased
            s.purchased_price=PurchasedPrice
            s.purchased_date=PurchasedDate
            s.stock_entry=StockEntry
            s.invoice_no=InvoiceNo
            db.session.commit()
            return '201'
    except:
        return '400'
    
@app.route('/purchasedcomponents/delete/<id>/',methods=['DELETE'])
def delete_purchased_components(id):
    try:
        with app.app_context():
            pdf_file = PurchasedComponents.query.get_or_404(id)
            count = PurchasedComponents.query.filter_by(filename=pdf_file.filename).count()
            m=PurchasedComponents.query.filter_by(id=id).first()
            db.session.delete(m)
            db.session.commit()
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], pdf_file.filename)
            if count==1:
                os.remove(filepath)
            return '201'
    except:
        return '400'


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
    
    
@app.route('/purchasedcomponents/get/vendornames',methods=['PUT'])
def get_purchased_components_vendor_search():
    with app.app_context():
        VendorName=request.json.get('VendorName')
        vendor_names = (db.session.query(PurchasedComponents.vendor_name)
                            .filter(PurchasedComponents.vendor_name.ilike(f"%{VendorName}%"))
                            .distinct()
                            .all())
        vendor_names_list = [vendor[0] for vendor in vendor_names]
        return jsonify(vendor_names_list)
    
    
    
@app.route('/purchasedcomponents/get/vendornames',methods=['GET'])
def get_purchased_components_vendor():
    with app.app_context():
        vendor_names = (db.session.query(PurchasedComponents.vendor_name)
                            .distinct()
                            .all())
        vendor_names_list = [vendor[0] for vendor in vendor_names]
        return jsonify(vendor_names_list)
    

#getcomponents by vendorname
@app.route('/purchasedcomponents/get/components/<sort>/',methods=['PUT'])
def get_purchased_components_by_vendor(sort):
    vendor=request.json.get('selectedVendor')
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.filter_by(vendor_name=vendor).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter_by(vendor_name=vendor).order_by(PurchasedComponents.purchased_date).all()
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



@app.route('/purchasedcomponents/get/componentnames',methods=['PUT'])
def get_purchased_components_component_search():
    with app.app_context():
        ComponentName=request.json.get('ComponentName')
        components = (db.session.query(PurchasedComponents.component_purchased)
                            .filter(PurchasedComponents.component_purchased.ilike(f"%{ComponentName}%"))
                            .distinct()
                            .all())
        components_list = [component[0] for component in components]
        return jsonify(components_list)
    
    
    
@app.route('/purchasedcomponents/get/componentnames',methods=['GET'])
def get_purchased_vendors_component():
    with app.app_context():
        components = (db.session.query(PurchasedComponents.component_purchased)
                            .distinct()
                            .all())
        components_list = [component[0] for component in components]
        return jsonify(components_list)
    

#getcomponent by component name
@app.route('/purchasedcomponents/get/allcomponents/<sort>/',methods=['PUT'])
def get_purchased_components_by_component(sort):
    selectedComponentPurchased=request.json.get('selectedComponentPurchased')
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.filter_by(component_purchased=selectedComponentPurchased).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter_by(component_purchased=selectedComponentPurchased).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
            return jsonify(data),200
    except:
        return '400'
    
    
    
@app.route('/purchasedcomponents/put/invoice',methods=['PUT'])
def get_purchased_components_invoice_search():
    with app.app_context():
        Invoice=request.json.get('InvoiceInput')
        invoices = (db.session.query(PurchasedComponents.invoice_no)
                            .filter(PurchasedComponents.invoice_no.ilike(f"%{Invoice}%"))
                            .distinct()
                            .all())
        invoices_list = [invoice[0] for invoice in invoices]
        return jsonify(invoices_list)
    
    
    
@app.route('/purchasedcomponents/get/invoice',methods=['GET'])
def get_purchased_invoice_component():
    with app.app_context():
        invoices = (db.session.query(PurchasedComponents.invoice_no)
                            .distinct()
                            .all())
        invoices_list = [invoice[0] for invoice in invoices]
        return jsonify(invoices_list)
    

#get components by invoice
@app.route('/purchasedcomponents/get/components/invoice/<sort>/',methods=['PUT'])
def get_purchased_components_by_invoice(sort):
    InvoiceNo=request.json.get('InvoiceNo')
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.filter_by(invoice_no=InvoiceNo).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter_by(invoice_no=InvoiceNo).order_by(PurchasedComponents.purchased_date).all()
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



@app.route('/purchasedcomponents/put/suppliedto',methods=['PUT'])
def get_purchased_components_suppliedto_search():
    with app.app_context():
        SuppliedTo=request.json.get('SuppliedToInput')
        supplies = (db.session.query(PurchasedComponents.supplied_to)
                            .filter(PurchasedComponents.supplied_to.ilike(f"%{SuppliedTo}%"))
                            .distinct()
                            .all())
        supplies_list = [supplie[0] for supplie in supplies]
        return jsonify(supplies_list)
    
    
    
@app.route('/purchasedcomponents/get/suppliedto',methods=['GET'])
def get_purchased_suppliedto_component():
    with app.app_context():
        supplies = (db.session.query(PurchasedComponents.supplied_to)
                            .distinct()
                            .all())
        supplies_list = [supplie[0] for supplie in supplies]
        return jsonify(supplies_list)
    

#get components by suppliedto
@app.route('/purchasedcomponents/get/components/suppliedto/<sort>/',methods=['PUT'])
def get_purchased_components_by_suppliedto(sort):
    SuppliedTo=request.json.get('SuppliedTo')
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.filter_by(supplied_to=SuppliedTo).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter_by(supplied_to=SuppliedTo).order_by(PurchasedComponents.purchased_date).all()
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
    
    
    

@app.route('/view/<int:id>', methods=['GET'])
def view_pdf(id):
    pdf_file = PurchasedComponents.query.get_or_404(id)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], pdf_file.filename)
    if os.path.exists(filepath):
        return send_file(filepath, mimetype='application/pdf')
    else:
        return jsonify({"error": "File not found"}), 400
    


@app.route('/get/options', methods=['GET'])
def get_options_for_supplied_to():
    dept=['IT Department','CSE Department','AE Department','CS-AIML Department','CS-DS Department','CS-IoT Department','CS-CYS Department','CSBS Department','CE Department','ECE Department','EEE Department','EIE Department','ME Department']
    q=PurchasedComponents.query.all()
    supplied_to_list = list(set([item.supplied_to for item in q]))
    for i in supplied_to_list:
        if i not in dept:
            dept.append(i)
    return jsonify(dept)


   
    

@app.route('/vendor/generate_pdf/<sort>/', methods=['POST'])
def generate_pdf_vendor(sort):
    vendor=request.json.get('selectedVendor')
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.filter_by(vendor_name=vendor).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter_by(vendor_name=vendor).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times",style='BI', size=15)
        pdf.cell(200, 15, txt=f"{vendor} Vendor Report", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        c=0
        for i in data:
            if c%5==0 and c!=0:
                pdf.set_font("Times",style='BI', size=15)
                pdf.cell(200, 15, txt=f"{vendor} Vendor Report", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            pdf.cell(200, 10, txt=f"Component Purchased : {i['component_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {i['purchased_price']}rs, Quantity Purchased : {i['quantity_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {i['invoice_no']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To : {i['supplied_to']}, Stock Entry : {i['stock_entry']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date : {i['purchased_date']}, Updated Date : {i['updated_date'].split('T')[0]}, Updated Time : {i['updated_date'].split('T')[1]}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c+=1
            
        

        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)
        
        filename=f"{vendor} report.pdf"

        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
    except:
        return '400'
    
    
    
@app.route('/component/generate_pdf/<sort>/', methods=['POST'])
def generate_pdf_component(sort):
    selectedComponentPurchased=request.json.get('selectedComponentPurchased')
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.filter_by(component_purchased=selectedComponentPurchased).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter_by(component_purchased=selectedComponentPurchased).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times",style='BI', size=15)
        pdf.cell(200, 15, txt=f"{selectedComponentPurchased} Component Report", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        c=0
        for i in data:
            if c%5==0 and c!=0:
                pdf.set_font("Times",style='BI', size=15)
                pdf.cell(200, 15, txt=f"{selectedComponentPurchased} Component Report", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            pdf.cell(200, 10, txt=f"Vendor Name : {i['vendor_name']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {i['purchased_price']}rs, Quantity Purchased : {i['quantity_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {i['invoice_no']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To : {i['supplied_to']}, Stock Entry : {i['stock_entry']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date : {i['purchased_date']}, Updated Date : {i['updated_date'].split('T')[0]}, Updated Time : {i['updated_date'].split('T')[1]}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c+=1
   

        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)
        
        filename=f"{selectedComponentPurchased} report.pdf"

        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
    except:
        return '400'



@app.route('/invoice/generate_pdf/<sort>/', methods=['POST'])
def generate_pdf_invoice(sort):
    InvoiceNo=request.json.get('InvoiceNo')
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.filter_by(invoice_no=InvoiceNo).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter_by(invoice_no=InvoiceNo).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times",style='BI', size=15)
        pdf.cell(200, 15, txt=f"Invoice Report for Invoice No. {InvoiceNo}", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        c=0
        for i in data:
            if c%5==0 and c!=0:
                pdf.set_font("Times",style='BI', size=15)
                pdf.cell(200, 15, txt=f"Invoice Report for Invoice No. {InvoiceNo}", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            pdf.cell(200, 10, txt=f"Vendor Name : {i['vendor_name']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Component Purchased : {i['component_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {i['purchased_price']}rs, Quantity Purchased : {i['quantity_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To : {i['supplied_to']}, Stock Entry : {i['stock_entry']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date : {i['purchased_date']}, Updated Date : {i['updated_date'].split('T')[0]}, Updated Time : {i['updated_date'].split('T')[1]}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c+=1
   

        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)
        
        filename=f"{InvoiceNo} report.pdf"

        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
    except:
        return '400'
    
    
    
@app.route('/suppliedto/generate_pdf/<sort>/', methods=['POST'])
def generate_pdf_suppliedto(sort):
    SuppliedTo=request.json.get('SuppliedTo')
    try:
        with app.app_context():
            if sort=='true':
                d=PurchasedComponents.query.filter_by(supplied_to=SuppliedTo).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d=PurchasedComponents.query.filter_by(supplied_to=SuppliedTo).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times",style='BI', size=15)
        pdf.cell(200, 15, txt=f"Report on Components Supplied to {SuppliedTo}", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        c=0
        for i in data:
            if c%5==0 and c!=0:
                pdf.set_font("Times",style='BI', size=15)
                pdf.cell(200, 15, txt=f"Report on Components Supplied to {SuppliedTo}", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            pdf.cell(200, 10, txt=f"Vendor Name : {i['vendor_name']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Component Purchased : {i['component_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {i['purchased_price']}rs, Quantity Purchased : {i['quantity_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {i['invoice_no']}, Stock Entry : {i['stock_entry']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Date : {i['purchased_date']}, Updated Date : {i['updated_date'].split('T')[0]}, Updated Time : {i['updated_date'].split('T')[1]}", ln=True, align='L')
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c+=1
   

        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)
        
        filename=f"{SuppliedTo} report.pdf"

        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
    except:
        return '400'
    
    
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
    d=PurchasedComponents.query.all()
    totalamount=0
    totalcomponents=0
    totalvendors=[]
    uniquecomponents=[]
    for i in d:
        totalamount+=int(i.purchased_price)
        totalcomponents+=int(i.quantity_purchased)
        totalvendors.append(i.vendor_name)
        uniquecomponents.append(i.component_purchased)
    data={}
    data['initialamount']=totalamount
    data['totalamount']=int(1.18*totalamount)
    data['cgst']=int(0.09*totalamount)
    data['sgst']=int(0.09*totalamount)
    data['totalcomponents']=totalcomponents
    data['totalvendors']=len(set(totalvendors))
    data['uniquecomponents']=len(set(uniquecomponents))
    return jsonify(data)



@app.route('/get/component/date/<sort>/', methods=['PUT'])
def get_component_by_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    Component = request.json.get('Component')
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            if sort=='true':
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(component_purchased=Component).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(component_purchased=Component).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
        return jsonify(data)
    except:
        return '400'
    
    
    
@app.route('/get/vendor/date/<sort>/', methods=['PUT'])
def get_vendor_by_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    Vendor = request.json.get('Vendor')
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            if sort=='true':
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(vendor_name=Vendor).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(vendor_name=Vendor).order_by(PurchasedComponents.purchased_date).all()
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



@app.route('/get/suppliedto/date/<sort>/', methods=['PUT'])
def get_suppliedto_by_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    SuppliedTo = request.json.get('SuppliedTo')
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            if sort=='true':
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(supplied_to=SuppliedTo).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(supplied_to=SuppliedTo).order_by(PurchasedComponents.purchased_date).all()
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
    
    
    
    
@app.route('/component/generate_pdf/date/<sort>/', methods=['POST'])
def generate_pdf_component_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    Component = request.json.get('Component')
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            if sort=='true':
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(component_purchased=Component).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(component_purchased=Component).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times",style='BI', size=15)
        pdf.cell(200, 15, txt=f"{Component} Component Report (from {from_date} to {to_date})", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        c=0
        for i in data:
            if c%5==0 and c!=0:
                pdf.set_font("Times",style='BI', size=15)
                pdf.cell(200, 15, txt=f"{Component} Component Report (from {from_date} to {to_date})", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            pdf.cell(200, 10, txt=f"Vendor Name : {i['vendor_name']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {i['purchased_price']}rs, Quantity Purchased : {i['quantity_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {i['invoice_no']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To : {i['supplied_to']}, Stock Entry : {i['stock_entry']}", ln=True, align='L')
            pdf.set_font("Times",style='B', size=12)
            pdf.cell(200, 10, txt=f"Purchased Date : {i['purchased_date']}, Updated Date : {i['updated_date'].split('T')[0]}, Updated Time : {i['updated_date'].split('T')[1]}", ln=True, align='L')
            pdf.set_font("Times", size=12)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c+=1
   

        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)
        
        filename=f"{Component} Component Report (from {from_date} to {to_date}).pdf"

        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
    except:
        return '400'
    
    
    
@app.route('/vendor/generate_pdf/date/<sort>/', methods=['POST'])
def generate_pdf_vendor_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    Vendor = request.json.get('Vendor')
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            if sort=='true':
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(vendor_name=Vendor).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(vendor_name=Vendor).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times",style='BI', size=15)
        pdf.cell(200, 15, txt=f"{Vendor} Vendor Report (from {from_date} to {to_date})", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        c=0
        for i in data:
            if c%5==0 and c!=0:
                pdf.set_font("Times",style='BI', size=15)
                pdf.cell(200, 15, txt=f"{Vendor} Vendor Report (from {from_date} to {to_date})", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            pdf.cell(200, 10, txt=f"Component Purchased : {i['component_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {i['purchased_price']}rs, Quantity Purchased : {i['quantity_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {i['invoice_no']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Supplied To : {i['supplied_to']}, Stock Entry : {i['stock_entry']}", ln=True, align='L')
            pdf.set_font("Times",style='B', size=12)
            pdf.cell(200, 10, txt=f"Purchased Date : {i['purchased_date']}, Updated Date : {i['updated_date'].split('T')[0]}, Updated Time : {i['updated_date'].split('T')[1]}", ln=True, align='L')
            pdf.set_font("Times", size=12)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c+=1
   

        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)
        
        filename=f"{Vendor} Vendor Report (from {from_date} to {to_date}).pdf"

        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
    except:
        return '400'
    
    
    
@app.route('/suppliedto/generate_pdf/date/<sort>/', methods=['POST'])
def generate_pdf_suppliedto_date(sort):
    from_date_str = request.json.get('from_date')
    to_date_str = request.json.get('to_date')
    SuppliedTo = request.json.get('SuppliedTo')
    try:
        with app.app_context():
            from_date = datetime.datetime.strptime(from_date_str, '%Y-%m-%d').date()
            to_date = datetime.datetime.strptime(to_date_str, '%Y-%m-%d').date()
            if sort=='true':
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(supplied_to=SuppliedTo).order_by(PurchasedComponents.purchased_date.desc()).all()
                data=purchased_components_schema.dump(d)
            else:
                d = PurchasedComponents.query.filter(
                    PurchasedComponents.purchased_date >= from_date,
                    PurchasedComponents.purchased_date <= to_date
                ).filter_by(supplied_to=SuppliedTo).order_by(PurchasedComponents.purchased_date).all()
                data=purchased_components_schema.dump(d)
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Times",style='BI', size=15)
        pdf.cell(200, 15, txt=f"Report on Components Supplied to {SuppliedTo} (from {from_date} to {to_date})", ln=True, align='L')
        pdf.set_font("Times", size=12)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        c=0
        for i in data:
            if c%5==0 and c!=0:
                pdf.set_font("Times",style='BI', size=15)
                pdf.cell(200, 15, txt=f"Report on Components Supplied to {SuppliedTo} (from {from_date} to {to_date})", ln=True, align='L')
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.set_font("Times", size=12)
            pdf.cell(200, 10, txt=f"Vendor Name : {i['vendor_name']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Component Purchased : {i['component_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Purchased Price : {i['purchased_price']}rs, Quantity Purchased : {i['quantity_purchased']}", ln=True, align='L')
            pdf.cell(200, 10, txt=f"Invoice No. : {i['invoice_no']}, Stock Entry : {i['stock_entry']}", ln=True, align='L')
            pdf.set_font("Times",style='B', size=12)
            pdf.cell(200, 10, txt=f"Purchased Date : {i['purchased_date']}, Updated Date : {i['updated_date'].split('T')[0]}, Updated Time : {i['updated_date'].split('T')[1]}", ln=True, align='L')
            pdf.set_font("Times", size=12)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            c+=1
   

        buffer = io.BytesIO()
        pdf.output(dest='S').encode('latin1')
        buffer.write(pdf.output(dest='S').encode('latin1'))
        buffer.seek(0)
        
        filename=f"Report on Components Supplied to {SuppliedTo} (from {from_date} to {to_date}).pdf"

        return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
    except:
        return '400'
    
    
    
@app.route('/get/component/options',methods=['PUT'])
def get_options_component_search():
        FromDate = request.json.get('FromDate')
        ToDate = request.json.get('ToDate')
        query = db.session.query(PurchasedComponents.component_purchased).distinct()
        if FromDate and ToDate:
            query = query.filter(
                PurchasedComponents.purchased_date >= FromDate,
                PurchasedComponents.purchased_date <= ToDate
            )
        components = query.order_by(PurchasedComponents.purchased_date).all()
        components_list = [component[0] for component in components]
        return jsonify(components_list)
    
    

@app.route('/get/vendor/options',methods=['PUT'])
def get_options_vendor_search():
    with app.app_context():
        FromDate = request.json.get('FromDate')
        ToDate = request.json.get('ToDate')
        query = db.session.query(PurchasedComponents.vendor_name).distinct()
        if FromDate and ToDate:
            query = query.filter(
                PurchasedComponents.purchased_date >= FromDate,
                PurchasedComponents.purchased_date <= ToDate
            )
        vendors = query.order_by(PurchasedComponents.purchased_date).all()
        vendors_list = [vendor[0] for vendor in vendors]
        return jsonify(vendors_list)
    
    
    
@app.route('/get/suppliedto/options',methods=['PUT'])
def get_options_suppliedto_search():
    with app.app_context():
        FromDate = request.json.get('FromDate')
        ToDate = request.json.get('ToDate')
        query = db.session.query(PurchasedComponents.supplied_to).distinct()
        if FromDate and ToDate:
            query = query.filter(
                PurchasedComponents.purchased_date >= FromDate,
                PurchasedComponents.purchased_date <= ToDate
            )
        supplies = query.order_by(PurchasedComponents.purchased_date).all()
        supplies_list = [supplie[0] for supplie in supplies]
        return jsonify(supplies_list)
    



if __name__=='__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug = True)