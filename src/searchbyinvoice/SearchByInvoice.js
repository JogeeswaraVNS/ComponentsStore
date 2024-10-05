import axios from "axios";
import React, { useEffect, useState } from "react";
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

function SearchByInvoice() {
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

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/view/${pdfId}`,
          {
            responseType: "blob",
          }
        );
        const url = URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        setPdfUrl(url);
      } catch (error) {
        console.error("Error fetching the PDF", error);
      }
    };

    fetchPdf();
    return () => {
      URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfId]);

  const handlesubmit = () => {
    if (
      selectedVendor !== null &&
      selectedComponentPurchased !== null &&
      QuantityPurchased !== 0 &&
      PurchasedPrice !== null &&
      PurchasedDate !== null &&
      StockEntry !== null &&
      InvoiceNo !== null
    ) {
      axios
        .put("http://127.0.0.1:5000/purchasedcomponents/put", {
          id: editID,
          selectedVendor: selectedVendor,
          selectedComponentPurchased: selectedComponentPurchased,
          QuantityPurchased: QuantityPurchased,
          PurchasedPrice: PurchasedPrice,
          PurchasedDate: PurchasedDate,
          StockEntry: StockEntry,
          InvoiceNo: InvoiceNo,
        })
        .then((r) => seteditstatus(r.data))
        .catch((err) => seteditstatus(err.response.editstatus));
    } else {
      seteditstatus(400);
    }
  };

  function DeleteSelectedComponent() {
    axios
      .delete(`http://127.0.0.1:5000/purchasedcomponents/delete/${delID}/`)
      .then((r) => {
        setdelstatus(r.data);
      })
      .catch((err) => setdelstatus(err.response.editstatus));
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
      .get(`http://127.0.0.1:5000/purchasedcomponents/get/invoice`)
      .then((r) => setInvoiceData(r.data))
      .catch((err) => console.log(err.response?.status));
  }, []);

  useEffect(() => {
    axios
      .put(
        `http://127.0.0.1:5000/purchasedcomponents/get/components/invoice/${sort}/`,
        {
          InvoiceNo: InvoiceNo,
        }
      )
      .then((r) => {
        const invoices = r.data;

        let QuantityArray = [];

        invoices.forEach((invoice) => {
          let Quantities = 0;
          invoice.items.forEach((item) => {
            Quantities += parseInt(item.quantity_purchased);
          });
          QuantityArray.push(Quantities);
        });

        // console.log(QuantityArray)

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
      .catch((error) => console.log(error));
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
      <Modal
        show={editsubmitstatus}
        backdrop="static"
        centered
        className="modal-lg"
      >
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ marginRight: "auto" }}></div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-close pt-5 pe-5"
              type="button"
              onClick={() => seteditsubmitstatus(false)}
            ></button>
          </div>
        </div>

        <ModalBody style={{ marginTop: "-2rem", marginBottom: "1.5rem" }}>
          {editstatus === 201 && (
            <div>
              <div>
                <svg
                  style={{ display: "block", margin: "auto" }}
                  fill="#198754"
                  xmlns="http://www.w3.org/2010/svg"
                  height="100"
                  width="100"
                  viewBox="0 0 512 512"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                </svg>
              </div>

              <h3 style={{ textAlign: "center" }} className="text-success mt-3">
                Successfully Component Updated to the Database
              </h3>
            </div>
          )}

          {editstatus === 400 && (
            <div>
              <div>
                <svg
                  style={{ display: "block", margin: "auto" }}
                  fill="#dc3545"
                  xmlns="http://www.w3.org/2010/svg"
                  height="100"
                  width="100"
                  viewBox="0 0 512 512"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" />
                </svg>
              </div>

              <h3 style={{ textAlign: "center" }} className="text-danger mt-3">
                Something Went Wrong
              </h3>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              className="btn btn-primary mt-4"
              onClick={() => {
                seteditsubmitstatus(false);
                if (editstatus === 201) {
                  window.location.reload();
                }
              }}
            >
              <h6 className="px-2 mt-1">Ok</h6>
            </button>
          </div>
        </ModalBody>
      </Modal>
      <Modal
        show={delsubmitstatus}
        backdrop="static"
        centered
        className="modal-lg"
      >
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ marginRight: "auto" }}></div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-close pt-5 pe-5"
              type="button"
              onClick={() => setdelsubmitstatus(false)}
            ></button>
          </div>
        </div>

        <ModalBody style={{ marginTop: "-2rem", marginBottom: "1.5rem" }}>
          {delstatus === 201 && (
            <div>
              <div>
                <svg
                  style={{ display: "block", margin: "auto" }}
                  fill="#198754"
                  xmlns="http://www.w3.org/2010/svg"
                  height="100"
                  width="100"
                  viewBox="0 0 512 512"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                </svg>
              </div>

              <h3 style={{ textAlign: "center" }} className="text-success mt-3">
                Successfully Component Deleted from the Database
              </h3>
            </div>
          )}

          {delstatus === 400 && (
            <div>
              <div>
                <svg
                  style={{ display: "block", margin: "auto" }}
                  fill="#dc3545"
                  xmlns="http://www.w3.org/2010/svg"
                  height="100"
                  width="100"
                  viewBox="0 0 512 512"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" />
                </svg>
              </div>

              <h3 style={{ textAlign: "center" }} className="text-danger mt-3">
                Something Went Wrong
              </h3>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              className="btn btn-primary mt-4"
              onClick={() => {
                setdelsubmitstatus(false);
                if (delstatus === 201) {
                  window.location.reload();
                }
              }}
            >
              <h6 className="px-2 mt-1">Ok</h6>
            </button>
          </div>
        </ModalBody>
      </Modal>

      <Modal show={editShow} backdrop="static" centered className="modal-lg">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <h4 className="pt-4 ps-4">Edit Your Component</h4>
          <div style={{ marginRight: "auto" }}></div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-close pt-5 pe-5"
              type="button"
              onClick={() => seteditShow(false)}
            ></button>
          </div>
        </div>
        <ModalBody>
          <div className="px-2">
            <form>
              <div class="mb-3">
                <div className="row">
                  <div className="col-auto mt-1 mb-4">
                    <label for="Vendor" class="form-label">
                      <h5>Vendor Name</h5>
                    </label>
                  </div>
                  <div className="col">
                    <input
                      required
                      type="text"
                      style={{ border: "1px solid black" }}
                      class="form-control"
                      value={selectedVendor}
                      onChange={(event) => {
                        setSelectedVendor(event.target.value);
                      }}
                    ></input>
                  </div>
                </div>
                <div className="row">
                  <div className="col-auto mt-1">
                    <label for="ComponentPurchased" class="form-label">
                      <h5>Component Purchased</h5>
                    </label>
                  </div>
                  <div className="col">
                    <input
                      required
                      type="text"
                      style={{ border: "1px solid black" }}
                      class="form-control"
                      value={selectedComponentPurchased}
                      onChange={(event) => {
                        setSelectedComponentPurchased(event.target.value);
                      }}
                    ></input>
                  </div>
                </div>

                <div className="row mt-4">
                  <div className="col-auto mt-2">
                    <label for="Quantity" class="form-label">
                      <h5>Quantity Purchased</h5>
                    </label>
                  </div>
                  <div className="col">
                    <div class="input-group">
                      <button
                        onClick={() => {
                          setQuantityPurchased(parseInt(QuantityPurchased) - 1);
                        }}
                        class="btn btn-outline-secondary"
                        type="button"
                      >
                        <RemoveIcon />
                      </button>
                      <input
                        required
                        style={{
                          textAlign: "center",
                          border: "1px solid black",
                        }}
                        type="text"
                        class="form-control"
                        value={QuantityPurchased}
                        onChange={(event) => {
                          setQuantityPurchased(event.target.value);
                        }}
                      ></input>
                      <button
                        onClick={() => {
                          setQuantityPurchased(parseInt(QuantityPurchased) + 1);
                        }}
                        class="btn btn-outline-secondary"
                        type="button"
                      >
                        <AddIcon />
                      </button>
                    </div>
                  </div>
                  <div className="col-auto mt-1">
                    <label for="Price" class="form-label">
                      <h5>Purchased Price</h5>
                    </label>
                  </div>
                  <div className="col">
                    <input
                      required
                      type="text"
                      style={{ border: "1px solid black" }}
                      class="form-control"
                      value={PurchasedPrice}
                      onChange={(event) => {
                        setPurchasedPrice(event.target.value);
                      }}
                    ></input>
                  </div>
                </div>

                <div class="row mt-4">
                  <div className="col-auto mt-1">
                    <label for="PurchasedDate">
                      <h5>Purchased Date</h5>
                    </label>
                  </div>
                  <div className="col">
                    <input
                      required
                      style={{ border: "1px solid black" }}
                      value={PurchasedDate}
                      onChange={(event) => {
                        setPurchasedDate(event.target.value);
                      }}
                      type="date"
                      class="form-control"
                    ></input>
                  </div>
                  <div className="col-auto mt-1">
                    <label for="StockEntry">
                      <h5>Stock Entry</h5>
                    </label>
                  </div>
                  <div className="col">
                    <input
                      required
                      style={{ border: "1px solid black" }}
                      value={StockEntry}
                      onChange={(event) => {
                        setStockEntry(event.target.value);
                      }}
                      type="text"
                      class="form-control"
                    ></input>
                  </div>
                </div>
                <div class="row mt-4">
                  <div className="col-auto mt-2">
                    <label for="StockEntry">
                      <h5>Invoice No</h5>
                    </label>
                  </div>
                  <div className="col">
                    <input
                      required
                      style={{ border: "1px solid black" }}
                      value={InvoiceNo}
                      onChange={(event) => {
                        setInvoiceNo(event.target.value);
                      }}
                      type="text"
                      class="form-control"
                    ></input>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="py-2">
            <button
              style={{ borderRadius: "50%" }}
              className="btn btn-danger p-2"
              type="button"
              onClick={() => {
                seteditShow(false);
              }}
            >
              <CloseIcon
                style={{ height: "1.5rem", width: "1.5rem" }}
              ></CloseIcon>
            </button>
            <button
              style={{ borderRadius: "50%" }}
              className="btn btn-success p-2 me-2 ms-3"
              onClick={() => {
                handlesubmit();
                seteditShow(false);
                seteditsubmitstatus(true);
              }}
            >
              <DoneIcon
                style={{ height: "1.5rem", width: "1.5rem" }}
              ></DoneIcon>
            </button>
          </div>
        </ModalFooter>
      </Modal>

      <Modal show={delShow} backdrop="static" centered className="modal-lg">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <h4 className="pt-4 ps-4">
            Do you really want to Delete Your Component
          </h4>
          <div style={{ marginRight: "auto" }}></div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-close pt-5 pe-5"
              type="button"
              onClick={() => setdelShow(false)}
            ></button>
          </div>
        </div>
        <ModalBody>
          <div className="card">
            <div
              className="p-3"
              style={{
                display: "flex",
                justifyContent: "space-between",
                backgroundColor: "#f4e9e3",
              }}
            >
              <h5>{selectedVendor}</h5>
              <h5>{selectedComponentPurchased}</h5>
            </div>

            <div className="card-body">
              <h5>
                Quantity : {QuantityPurchased} | Purchased Price :{" "}
                {PurchasedPrice}rs | Purchased Date : {PurchasedDate}
              </h5>
              <h5>
                Stock Entry : {StockEntry} | Invoice No. : {InvoiceNo}
              </h5>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="py-2">
            <button
              style={{ borderRadius: "50%" }}
              className="btn btn-success p-2"
              type="button"
              onClick={() => setdelShow(false)}
            >
              <CloseIcon
                style={{ height: "1.5rem", width: "1.5rem" }}
              ></CloseIcon>
            </button>
            <button
              style={{ borderRadius: "50%" }}
              className="btn btn-danger p-2 me-2 ms-3"
              onClick={() => {
                DeleteSelectedComponent();
                setdelShow(false);
                setdelsubmitstatus(true);
              }}
            >
              <DoneIcon
                style={{ height: "1.5rem", width: "1.5rem" }}
              ></DoneIcon>
            </button>
          </div>
        </ModalFooter>
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
            <div className="col-auto pt-2">
              <input
                type="checkbox"
                checked={sort}
                id="check"
                label="Sort By Date&Time"
                onClick={() => {
                  setsort(!sort);
                }}
              />
              <label htmlFor="check" className="ms-1">
                <h5>Latest First</h5>
              </label>
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
                                    setpdfId(d.items[0].id);
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
                                  <h6>{item.component_purchased}</h6>
                                </div>
                                <div className="p-3">
                                  <h6>Quantity : {item.quantity_purchased}</h6>
                                  <h6>
                                    Purchased Price : {item.purchased_price}rs
                                  </h6>
                                  <h6>Stock Entry : {item.stock_entry}</h6>
                                </div>
                                <div
                                  className="py-2"
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-evenly",
                                  }}
                                >
                                  <div>
                                    <Button
                                      style={{ borderRadius: "50%" }}
                                      onClick={() => {
                                        setSelectedVendor(d.vendor_name);
                                        setPurchasedDate(d.purchased_date);
                                        setInvoiceNo(d.invoice_no);
                                        setSelectedComponentPurchased(
                                          item.component_purchased
                                        );
                                        setQuantityPurchased(
                                          item.quantity_purchased
                                        );
                                        setPurchasedPrice(item.purchased_price);
                                        setStockEntry(item.stock_entry);
                                        seteditShow(true);
                                        seteditID(item.id);
                                      }}
                                      className="btn btn-primary p-2"
                                    >
                                      <EditIcon
                                        style={{
                                          height: "1.5rem",
                                          width: "1.5rem",
                                        }}
                                      ></EditIcon>
                                    </Button>
                                  </div>
                                  <div>
                                    <Button
                                      style={{ borderRadius: "50%" }}
                                      onClick={() => {
                                        setSelectedVendor(d.vendor_name);
                                        setPurchasedDate(d.purchased_date);
                                        setInvoiceNo(d.invoice_no);
                                        setSelectedComponentPurchased(
                                          item.component_purchased
                                        );
                                        setQuantityPurchased(
                                          item.quantity_purchased
                                        );
                                        setPurchasedPrice(item.purchased_price);
                                        setStockEntry(item.stock_entry);
                                        setdelShow(true);
                                        setdelID(item.id);
                                      }}
                                      className="btn btn-danger p-2"
                                    >
                                      <DeleteIcon
                                        style={{
                                          height: "1.5rem",
                                          width: "1.5rem",
                                        }}
                                      ></DeleteIcon>
                                    </Button>
                                  </div>
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
                          {d.updated_date.split("T")[0]} | Updated Time :{" "}
                          {d.updated_date.split("T")[1]}
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