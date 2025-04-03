import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { logincontext } from "../contextapi/contextapi";
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

function SearchBySuppliedTo() {
  const [loginUser, setLoginUser] = useContext(logincontext);

  const [pdfUrl, setPdfUrl] = useState("");

  const [pdfId, setpdfId] = useState("");

  const [showpdf, setshowpdf] = useState(false);

  const [SuppliedToInput, setSuppliedToInput] = useState("");

  const [Data, setData] = useState([]);

  const [SuppliedToData, setSuppliedToData] = useState([]);

  const [TotalComponents, setTotalComponents] = useState(0);

  let [sort, setsort] = useState(false);

  let [show, setshow] = useState(false);

  let [selectedSuppliedToIdx, setselectedSuppliedToIdx] = useState(null);

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

  const [SuppliedTo, setSuppliedTo] = useState("");

  const [editsubmitstatus, seteditsubmitstatus] = useState(false);

  const [delsubmitstatus, setdelsubmitstatus] = useState(false);

  const [editstatus, seteditstatus] = useState(null);

  const [delstatus, setdelstatus] = useState(null);

  const [vendorId, setVendorId] = useState(null);

  const [componentId, setComponentId] = useState(null);

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

  useEffect(() => {
    setData([]);
    if (SuppliedToInput.length > 0) {
      axios
        .put(`http://127.0.0.1:5000/purchasedcomponents/put/suppliedto`, {
          SuppliedToInput: SuppliedToInput,
          user_id: loginUser.user_id,
        })
        .then((r) => setSuppliedToData(r.data))
        .catch((err) => console.log(err.response?.status));
    }
  }, [SuppliedToInput]);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:5000/purchasedcomponents/get/suppliedto`, {
        params: { user_id: loginUser.user_id },
      })
      .then((r) => setSuppliedToData(r.data))
      .catch((err) => console.log(err.response?.status));
  }, []);

  useEffect(() => {
    axios
      .put(
        `http://127.0.0.1:5000/purchasedcomponents/get/components/suppliedto/${sort}/`,
        {
          SuppliedTo: SuppliedTo,
          user_id: loginUser.user_id,
        }
      )
      .then((r) => {
        const invoices = r.data;
        let QuantityArray = [];

        invoices.forEach((invoice) => {
          let Quantities = 0;
          invoice.items.forEach((item) => {
            Quantities += parseInt(item.purchased_quantity);
          });
          QuantityArray.push(Quantities);
        });

        // console.log(QuantityArray)

        setTotalComponents(QuantityArray);
        setData(r.data);
      })
      .catch((err) => console.log(err.response?.status));
  }, [SuppliedTo, sort]);

  const handleGeneratePdf = () => {
    axios
      .post(
        `http://127.0.0.1:5000/suppliedto/generate_pdf/${sort}/`,
        {
          SuppliedTo: SuppliedTo,
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
        link.setAttribute("download", `${SuppliedTo} report.pdf`);
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

      <form style={{ width: "" }}>
        <div class="mb-3">
          <div className="row">
            <div className="col-auto mt-2">
              <label for="Vendor" class="form-label">
                <h5>Search By Supplied To.</h5>
              </label>
            </div>
            <div className="col">
              <input
                placeholder="Enter Supplied To."
                required
                type="text"
                style={{ border: "1px solid black" }}
                class="form-control"
                onChange={(event) => {
                  setselectedSuppliedToIdx(null);
                  setSuppliedToInput(event.target.value);
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
            <h5>{SuppliedToData.length} Results found</h5>
          </div>
        </div>
      </form>

      <div style={{ overflowY: "scroll", maxHeight: "40rem" }} className="">
        {SuppliedToData.map((d, idx) => (
          <div className="mt-2 pb-3 px-3">
            <div
              className={`btn ${
                selectedSuppliedToIdx === idx
                  ? "text-white btn-primary"
                  : "btn-outline-primary"
              }`}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div
                onClick={() => {
                  console.log(d);
                  setSuppliedTo(d);
                  setshow(!show);
                  setselectedSuppliedToIdx(idx);
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
                    {selectedSuppliedToIdx === idx && show && (
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
                            selectedSuppliedToIdx === idx && show
                              ? "rotate(180deg)"
                              : "",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {selectedSuppliedToIdx === idx && show && (
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
                          Purchased Date : {d.purchased_date} | Updated Date :{" "}
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

export default SearchBySuppliedTo;
