import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import Button from "react-bootstrap/Button";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Modal, ModalBody, ModalFooter } from "react-bootstrap";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { logincontext } from "../contextapi/contextapi";

function SearchByInvoice() {
  const [loginUser, setLoginUser] = useContext(logincontext);

  const [pdfUrl, setPdfUrl] = useState("");

  const [pdfId, setpdfId] = useState("");

  const [showpdf, setshowpdf] = useState(false);

  const [InvoiceInput, setInvoiceInput] = useState("");

  const [Data, setData] = useState([]);

  const [InvoiceData, setInvoiceData] = useState([]);

  const [TotalComponents, setTotalComponents] = useState(0);

  let [sort, setsort] = useState(false);

  let [show, setshow] = useState(false);

  let [selectedInvoiceIdx, setselectedInvoiceIdx] = useState(null);

  const [editShow, seteditShow] = useState(false);

  const [delShow, setdelShow] = useState(false);

  const [editID, seteditID] = useState(null);

  const [delID, setdelID] = useState(null);

  const [selectedVendor, setSelectedVendor] = useState(null);

  const [selectedComponentPurchased, setSelectedComponentPurchased] =
    useState(null);

  const [QuantityPurchased, setQuantityPurchased] = useState(0);

  const [PurchasedPrice, setPurchasedPrice] = useState(null);

  const [PurchasedDate, setPurchasedDate] = useState(null);

  const [StockEntry, setStockEntry] = useState(null);

  const [InvoiceNo, setInvoiceNo] = useState(null);

  const [editsubmitstatus, seteditsubmitstatus] = useState(false);

  const [delsubmitstatus, setdelsubmitstatus] = useState(false);

  const [editstatus, seteditstatus] = useState(null);

  const [delstatus, setdelstatus] = useState(null);

  const [suppliedTo, setSuppliedTo] = useState(null);

  const [vendorId, setVendorId] = useState(null);

  const [componentId, setComponentId] = useState(null);

  const [serial_number, setserial_number] = useState(null);

  const [warranty, setwarranty] = useState(null);

  const [customWarranty, setCustomWarranty] = useState("");

  const [showCustomInput, setShowCustomInput] = useState(false);

  const [user, setuser] = useState(null);

  const warrantyOptions = [
    { value: "3 months", label: "3 Months" },
    { value: "6 months", label: "6 Months" },
    { value: "1 year", label: "1 Year" },
    { value: "3 years", label: "3 Years" },
    { value: "5 years", label: "5 Years" },
    { value: "other", label: "Other" }, // Custom input trigger
  ];

  const handleWarrantyChange = (option) => {
    if (option.value === "other") {
      setwarranty(""); // Reset warranty when "Other" is selected
      setShowCustomInput(true);
    } else {
      setwarranty(option.value); // Set selected value
      // console.log(option)
      setShowCustomInput(false);
      setCustomWarranty(""); // Reset custom input
    }
  };

  useEffect(() => {
    const fetchPdf = async () => {
      if (!pdfId || !loginUser?.user_id) return; // Ensure both values are available

      try {
        const response = await axios.get(`http://localhost:5000/view`, {
          params: {
            invoice_no: pdfId,
            user_id: loginUser.user_id,
          },
          responseType: "blob",
        });
        const url = URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        setPdfUrl(url);
      } catch (error) {
        console.error("Error fetching the PDF", error);
      }
    };

    fetchPdf();
  }, [pdfId, loginUser?.user_id]); // Runs when pdfId or user_id changes

  const handlesubmit = () => {
    if (
      selectedVendor !== null &&
      selectedComponentPurchased !== null &&
      QuantityPurchased !== 0 &&
      PurchasedPrice !== null &&
      PurchasedDate !== null &&
      StockEntry !== null &&
      InvoiceNo !== null &&
      serial_number !== null &&
      warranty !== null
    ) {
      axios
        .put("http://127.0.0.1:5000/purchasedcomponents/put", {
          id: editID,
          user_id: loginUser.user_id,
          selectedVendor: selectedVendor,
          selectedComponentPurchased: selectedComponentPurchased,
          QuantityPurchased: QuantityPurchased,
          PurchasedPrice: PurchasedPrice,
          PurchasedDate: PurchasedDate,
          StockEntry: StockEntry,
          serial_number: serial_number,
          warranty: warranty,
          InvoiceNo: InvoiceNo,
          suppliedTo: suppliedTo,
          componentId: componentId,
          vendorId: vendorId,
        })
        .then((r) => {
          seteditstatus(201);
        })
        .catch((err) => seteditstatus(400));
    } else {
      seteditstatus(400);
    }
  };

  function DeleteSelectedComponent() {
    axios
      .delete(
        `http://127.0.0.1:5000/purchasedcomponents/delete/${delID}/${componentId}/${InvoiceNo}/${vendorId}/`
      )
      .then((r) => {
        setdelstatus(201);
      })
      .catch((err) => setdelstatus(400));
  }

  useEffect(() => {
    setData([]);
    if (InvoiceInput.length > 0) {
      axios
        .put(`http://127.0.0.1:5000/purchasedcomponents/put/invoice`, {
          InvoiceInput: InvoiceInput,
        })
        .then((r) => setInvoiceData(r.data))
        .catch((err) => console.log(err.response?.status));
    }
  }, [InvoiceInput]);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:5000/purchasedcomponents/get/invoice`, {
        params: { user_id: loginUser.user_id }, // Send user_id as a query parameter
      })
      .then((r) => setInvoiceData(r.data))
      .catch((err) => console.log(err.response?.status));
  }, []);

  useEffect(() => {
    console.log("invoice no is ", InvoiceNo);
    axios
      .put(
        `http://127.0.0.1:5000/purchasedcomponents/get/components/invoice/${sort}/`,
        {
          InvoiceNo: InvoiceNo,
          user_id: loginUser.user_id,
        }
      )
      .then((r) => {
        const invoices = r.data;
        console.log("Invoices data from backend is ", r.data[0].items[0]);

        let QuantityArray = [];

        invoices.forEach((invoice) => {
          let Quantities = 0;
          invoice.items.forEach((item) => {
            Quantities += parseInt(item.purchased_quantity);
          });
          QuantityArray.push(Quantities);
        });

        setTotalComponents(QuantityArray);
        setData(r.data);
      })
      .catch((err) => console.log(err.response?.status));
  }, [InvoiceNo, sort]);

  const handleGeneratePdf = () => {
    axios
      .post(
        `http://127.0.0.1:5000/invoice/generate_pdf/${sort}/`,
        {
          InvoiceNo: InvoiceNo,
          user_id: loginUser.user_id,
        },
        { responseType: "blob" }
      )
      .then((response) => {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${InvoiceNo} report.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((error) => console.log("error in ivoices is ", error));
  };

  return (
    <div className="px-5 pt-4">
      <Modal show={showpdf} backdrop="static" centered className="modal-lg">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ marginRight: "auto" }}></div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-close pt-5 pe-5"
              type="button"
              onClick={() => setshowpdf(false)}
            ></button>
          </div>
        </div>

        <ModalBody style={{ marginTop: "-2rem", marginBottom: "1.5rem" }}>
          <div>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                style={{ width: "100%", height: "600px" }}
                frameBorder="0"
              ></iframe>
            ) : (
              <p>Loading PDF...</p>
            )}
          </div>
        </ModalBody>
      </Modal>

      <form style={{ width: "" }}>
        <div class="mb-3">
          <div className="row">
            <div className="col-auto mt-2">
              <label for="Vendor" class="form-label">
                <h5>Search By Invoice No.</h5>
              </label>
            </div>
            <div className="col">
              <input
                placeholder="Enter Invoice No."
                required
                type="text"
                style={{ border: "1px solid black" }}
                class="form-control"
                onChange={(event) => {
                  setselectedInvoiceIdx(null);
                  setInvoiceInput(event.target.value);
                }}
              ></input>
            </div>
          </div>
          <div className="text-center pt-3">
            <h5>{InvoiceData.length} Results found</h5>
          </div>
        </div>
      </form>

      <div style={{ overflowY: "scroll", maxHeight: "40rem" }} className="">
        {InvoiceData.map((d, idx) => (
          <div className="mt-2 pb-3 px-3">
            <div
              className={`btn ${
                selectedInvoiceIdx === idx
                  ? "text-white btn-primary"
                  : "btn-outline-primary"
              }`}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div
                onClick={() => {
                  setInvoiceNo(d);
                  setshow(!show);
                  setselectedInvoiceIdx(idx);
                }}
                className="p-3"
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div className="my-1">
                    <h5>{d}</h5>
                  </div>

                  <div style={{ display: "flex" }}>
                    {selectedInvoiceIdx === idx && show && (
                      <div
                        className="btn btn-success me-2"
                        onClick={handleGeneratePdf}
                        type="button"
                      >
                        <DownloadIcon />
                        <h6 className="d-inline">Download Report</h6>
                      </div>
                    )}
                    <div>
                      <ExpandMoreIcon
                        className=""
                        style={{
                          fontSize: "2rem",
                          transform:
                            selectedInvoiceIdx === idx && show
                              ? "rotate(180deg)"
                              : "",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {selectedInvoiceIdx === idx && show && (
              <div
                style={{ overflowY: "scroll", maxHeight: "28rem" }}
                className=""
              >
                {Data.map((d, idx) => (
                  <div className="px-3 pb-4">
                    <div className="mt-3">
                      <div
                        style={{ backgroundColor: "#b6fcd5" }}
                        className="p-3"
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div className="pt-2">
                            <h6>
                              Total Components Purchased :{" "}
                              {TotalComponents[idx]}
                            </h6>
                          </div>

                          <div>
                            <div style={{ display: "flex" }}>
                              <div className="mt-2 pe-3">
                                <h6>Vendor : {d.vendor_name}</h6>
                              </div>
                              <div>
                                <Button
                                  onClick={() => {
                                    setpdfId(d.items[0].invoice_no);
                                    setshowpdf(true);
                                  }}
                                  className="btn btn-success"
                                >
                                  <VisibilityIcon
                                    className="pb-1"
                                    style={{
                                      height: "1.8rem",
                                      width: "1.8rem",
                                    }}
                                  ></VisibilityIcon>
                                  <h6 className="d-inline ps-1">
                                    View Invoice
                                  </h6>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        {d.items &&
                          d.items.map((item) => (
                            <div className="col-3 mt-4">
                              <div className="card-body">
                                <div
                                  className="p-3"
                                  style={{
                                    backgroundColor: "#f4e9e3",
                                  }}
                                >
                                  <h6>{item.component_name}</h6>
                                </div>
                                <div className="p-3">
                                  <h6>Quantity : {item.purchased_quantity}</h6>
                                  <h6>
                                    Purchased Price : {item.purchased_price}rs
                                  </h6>
                                  <h6>Stock Entry : {item.stock_entry}</h6>
                                  <h6>Serial No. : {item.serial_number}</h6>
                                  <h6>Warranty : {item.warranty}</h6>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                      <div
                        style={{
                          backgroundColor: "#f4e9e3",
                        }}
                        className="text-center mt-3 py-3"
                      >
                        <h6>
                          Supplied To {d.supplied_to} | Purchased Date :{" "}
                          {d.purchased_date} | Updated Date :{" "}
                          {d.updated_date.split(" ")[0]} | Updated Time :{" "}
                          {d.updated_date.split(" ")[1]}
                        </h6>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchByInvoice;
