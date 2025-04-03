import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { Modal, ModalBody, ModalFooter } from "react-bootstrap";
import { logincontext } from "../contextapi/contextapi";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import Button from "react-bootstrap/Button";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Select from "react-select";

function SearchByDate() {
  const [loginUser, setLoginUser] = useContext(logincontext);

  const [pdfUrl, setPdfUrl] = useState("");

  const [pdfId, setpdfId] = useState("");

  const [showpdf, setshowpdf] = useState(false);

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
  const [sort, setsort] = useState(false);

  const [Data, setData] = useState([]);

  const [FromDate, setFromDate] = useState(null);

  const [ToDate, setToDate] = useState(null);

  const [ComponentsShow, setComponentsShow] = useState(false);

  const [Component, setComponent] = useState(null);

  const [ComponentOptions, setComponentOptions] = useState(null);

  const [VendorsShow, setVendorsShow] = useState(false);

  const [Vendor, setVendor] = useState(null);

  const [VendorOptions, setVendorOptions] = useState(null);

  const [SuppliedToShow, setSuppliedToShow] = useState(false);

  const [SuppliedTo, setSuppliedTo] = useState(null);

  const [SuppliedToOptions, setSuppliedToOptions] = useState(null);

  const [TotalComponents, setTotalComponents] = useState(0);

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

  useEffect(() => {
    axios
      .put(`http://127.0.0.1:5000/get/component/options`, {
        FromDate: FromDate,
        ToDate: ToDate,
        user_id: loginUser.user_id,
      })
      .then((response) => {
        const options = response.data.map((option) => ({
          value: option,
          label: option,
        }));
        setComponentOptions(options);
      })
      .catch((err) => console.log(err));

    axios
      .put(`http://127.0.0.1:5000/get/vendor/options`, {
        FromDate: FromDate,
        ToDate: ToDate,
        user_id: loginUser.user_id,
      })
      .then((response) => {
        console.log("vendor data is ", response.data);
        const options = response.data.map((option) => ({
          value: option,
          label: option,
        }));
        setVendorOptions(options);
      })
      .catch((err) => console.log(err.response?.status));

    axios
      .put("http://127.0.0.1:5000/get/suppliedto/options", {
        FromDate: FromDate,
        ToDate: ToDate,
        user_id: loginUser.user_id,
      })
      .then((response) => {
        console.log("supplied to options is ", response.data);
        const options = response.data.map((option) => ({
          value: option,
          label: option,
        }));
        setSuppliedToOptions(options);
      })
      .catch((error) => {
        console.error("Error fetching supplied to options:", error);
      });
  }, [FromDate, ToDate]);

  const handlesubmit = () => {
    console.log("componet id is ", componentId, " vendor id is ", vendorId);
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
          suppliedTo: SuppliedTo,
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

  const handleSelectChangeComponent = (selectedOption) => {
    setComponent(selectedOption);
    axios
      .put(`http://127.0.0.1:5000/get/component/date/${sort}/`, {
        from_date: FromDate,
        to_date: ToDate,
        Component: selectedOption.value,
        user_id: loginUser.user_id,
      })
      .then((r) => setData(r.data))
      .catch((err) => console.log(err.response?.status));
  };

  const handleSelectChangeVendor = (selectedOption) => {
    setVendor(selectedOption);
    axios
      .put(`http://127.0.0.1:5000/get/vendor/date/${sort}/`, {
        from_date: FromDate,
        to_date: ToDate,
        Vendor: selectedOption.value,
        user_id: loginUser.user_id,
      })
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

        setTotalComponents(QuantityArray);
        setData(r.data);
      })
      .catch((err) => console.log(err.response?.status));
  };

  const handleSelectChangeSuppliedTo = (selectedOption) => {
    setSuppliedTo(selectedOption);
    axios
      .put(`http://127.0.0.1:5000/get/suppliedto/date/${sort}/`, {
        from_date: FromDate,
        to_date: ToDate,
        SuppliedTo: selectedOption.value,
        user_id: loginUser.user_id,
      })
      .then((r) => setData(r.data))
      .catch((err) => console.log(err.response?.status));
  };

  const handleGeneratePdfComponent = () => {
    axios
      .post(
        `http://127.0.0.1:5000/component/generate_pdf/date/${sort}/`,
        {
          from_date: FromDate,
          to_date: ToDate,
          Component: Component.value,
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
        link.setAttribute(
          "download",
          `${Component?.value} Component Report (from ${FromDate} to ${ToDate}).pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((error) => console.log(error));
  };

  const handleGeneratePdfVendor = () => {
    axios
      .post(
        `http://127.0.0.1:5000/vendor/generate_pdf/date/${sort}/`,
        {
          from_date: FromDate,
          to_date: ToDate,
          Vendor: Vendor.value,
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
        link.setAttribute(
          "download",
          `${Vendor?.value} Vendor Report (from ${FromDate} to ${ToDate}).pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((error) => console.log(error));
  };

  const handleGeneratePdfSuppliedTo = () => {
    axios
      .post(
        `http://127.0.0.1:5000/suppliedto/generate_pdf/date/${sort}/`,
        {
          from_date: FromDate,
          to_date: ToDate,
          SuppliedTo: SuppliedTo.value,
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
        link.setAttribute(
          "download",
          `Report on Components Supplied to ${SuppliedTo?.value} (from ${FromDate} to ${ToDate}).pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((error) => console.log(error));
  };

  const DownloadAllComponents = () => {
    axios
      .post(
        `http://127.0.0.1:5000/components/generate_pdf/all`,
        {
          from_date: FromDate,
          to_date: ToDate,
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
        link.setAttribute(
          "download",
          `Components Purchased (from ${FromDate} to ${ToDate}).pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((error) => console.log(error));
  };

  const DownloadAllVendors = () => {
    axios
      .post(
        `http://127.0.0.1:5000/vendors/generate_pdf/all`,
        {
          from_date: FromDate,
          to_date: ToDate,
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
        link.setAttribute(
          "download",
          `All Vendors Report (from ${FromDate} to ${ToDate}).pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    if (Component !== null) {
      axios
        .put(`http://127.0.0.1:5000/get/component/date/${sort}/`, {
          from_date: FromDate,
          to_date: ToDate,
          Component: Component.value,
        })
        .then((r) => setData(r.data))
        .catch((err) => console.log(err.response?.status));
    }
    if (Vendor !== null) {
      axios
        .put(`http://127.0.0.1:5000/get/vendor/date/${sort}/`, {
          from_date: FromDate,
          to_date: ToDate,
          Vendor: Vendor.value,
        })
        .then((r) => setData(r.data))
        .catch((err) => console.log(err.response?.status));
    }
    if (SuppliedTo !== null) {
      axios
        .put(`http://127.0.0.1:5000/get/vendor/date/${sort}/`, {
          from_date: FromDate,
          to_date: ToDate,
          SuppliedTo: SuppliedTo.value,
        })
        .then((r) => setData(r.data))
        .catch((err) => console.log(err.response?.status));
    }
  }, [sort]);

  return (
    <div>
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
              ></iframe>
            ) : (
              <p>Loading PDF...</p>
            )}
          </div>
        </ModalBody>
      </Modal>

      <Modal
        show={ComponentsShow}
        backdrop="static"
        centered
        className="modal-xl"
      >
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ marginRight: "auto" }}>
            <h4 className="p-3">Select Component</h4>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div>
              <div
                type="button"
                onClick={() => {
                  DownloadAllComponents();
                }}
                className="btn btn-primary mt-3"
              >
                Download all
              </div>
            </div>
            <div>
              <button
                className="btn-close pt-5 pe-5"
                type="button"
                onClick={() => {
                  setData([]);
                  setComponent(null);
                  setComponentsShow(false);
                }}
              ></button>
            </div>
          </div>
        </div>

        <ModalBody
          style={{
            marginTop: "-1rem",
            minHeight: "35rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="col">
              <Select
                value={Component}
                onChange={handleSelectChangeComponent}
                options={ComponentOptions}
                isSearchable={true}
                styles={{
                  menu: (provided) => ({
                    ...provided,
                  }),
                }}
                placeholder="-- Select --"
              />
            </div>
          </div>
          <div
            style={{ overflowY: "scroll", height: "31.5rem" }}
            className="row pt-1"
          >
            {Data &&
              Data.map((d) =>
                d.items.map((item, index) => (
                  <div
                    className="col-4 mt-4 px-3 pb-2"
                    key={`${d.id}-${index}`}
                  >
                    <div className="card">
                      <div className="">
                        <div style={{ textAlign: "center" }}>
                          <Button
                            onClick={() => {
                              setpdfId(d.invoice_no);
                              setshowpdf(true);
                            }}
                            style={{ width: "100%", borderRadius: "0" }}
                            className="btn btn-success"
                          >
                            <VisibilityIcon
                              className="pb-1"
                              style={{
                                height: "1.8rem",
                                width: "1.8rem",
                              }}
                            />
                            <h6 className="d-inline ps-1">View Invoice</h6>
                          </Button>
                        </div>
                      </div>
                      <div
                        className="p-3"
                        style={{ backgroundColor: "#f4e9e3" }}
                      >
                        <h6>{d.vendor_name}</h6>
                      </div>
                      <div
                        className="card-body"
                        onClick={() => console.log(item)}
                      >
                        <h6>Invoice No. : {d.invoice_no}</h6>
                        <h6>Quantity : {item.quantity_purchased}</h6>
                        <h6>Purchased Price : {item.purchased_price}rs</h6>
                        <h6>Stock Entry : {item.stock_entry}</h6>
                        <h6>Serial No. : {item.serial_number}</h6>
                        <h6>Warranty : {item.warranty}</h6>
                        <h6>Purchased Date : {item.purchased_date}</h6>
                        <h6>
                          Updated Date :{" "}
                          {item.updated_date.split(" ").slice(0, 4).join(" ")}
                        </h6>
                        <h6>
                          Updated Time :{" "}
                          {item.updated_date.split(" ").slice(4).join(" ")}
                        </h6>
                      </div>
                      <div
                        className="p-3"
                        style={{ backgroundColor: "#f4e9e3" }}
                      >
                        <h6>Supplied to {item.supplied_to}</h6>
                      </div>
                    </div>
                  </div>
                ))
              )}
            {Data.length === 0 && (
              <div className="pt-3">
                <h5>Select Component</h5>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          {Data.length !== 0 && (
            <div
              onClick={handleGeneratePdfComponent}
              style={{ width: "100%" }}
              className="btn btn-primary"
            >
              <h5>Download Report</h5>
            </div>
          )}
        </ModalFooter>
      </Modal>

      <Modal show={VendorsShow} backdrop="static" centered className="modal-xl">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ marginRight: "auto" }}>
            <h4 className="p-3">Select Vendor</h4>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div>
              <div
                type="button"
                onClick={() => {
                  DownloadAllVendors();
                }}
                className="btn btn-primary mt-3"
              >
                Download all
              </div>
            </div>
            <div>
              <button
                className="btn-close pt-5 pe-5"
                type="button"
                onClick={() => {
                  setData([]);
                  setVendor(null);
                  setVendorsShow(false);
                }}
              ></button>
            </div>
          </div>
        </div>

        <ModalBody
          style={{
            marginTop: "-1rem",
            minHeight: "35rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="col">
              <Select
                value={Vendor}
                onChange={handleSelectChangeVendor}
                options={VendorOptions}
                isSearchable={true}
                styles={{
                  menu: (provided) => ({
                    ...provided,
                  }),
                }}
                placeholder="-- Select --"
              />
            </div>
          </div>
          <div
            style={{ overflowY: "scroll", height: "31.5rem" }}
            className="row pt-1"
          >
            {Data.map((d, idx) => (
              <div className="px-3 pb-4">
                <div className="mt-3">
                  <div style={{ backgroundColor: "#b6fcd5" }} className="p-3">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="pt-2">
                        <h6>
                          Total Components Purchased : {TotalComponents[idx]}
                        </h6>
                      </div>

                      <div>
                        <div style={{ display: "flex" }}>
                          <div className="mt-2 pe-2">
                            <h6>Invoice No. : {d.invoice_no}</h6>
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
                              <h6 className="d-inline ps-1">View Invoice</h6>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    {d.items &&
                      d.items.map((item) => (
                        <div className="col-4 mt-4">
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
                      {d.updated_date.split(" ").slice(0, 4).join(" ")} |
                      Updated Time :{" "}
                      {d.updated_date.split(" ").slice(4).join(" ")}
                    </h6>
                  </div>
                </div>
              </div>
            ))}
            {Data.length === 0 && (
              <div className="pt-3">
                <h5>Select Vendor</h5>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          {Data.length !== 0 && (
            <div
              onClick={handleGeneratePdfVendor}
              style={{ width: "100%" }}
              className="btn btn-primary"
            >
              <h5>Download Report</h5>
            </div>
          )}
        </ModalFooter>
      </Modal>

      <Modal
        show={SuppliedToShow}
        backdrop="static"
        centered
        className="modal-xl"
      >
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ marginRight: "auto" }}>
            <h4 className="p-3">Select SuppliedTo</h4>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div>
              <button
                className="btn-close pt-5 pe-5"
                type="button"
                onClick={() => {
                  setData([]);
                  setSuppliedTo(null);
                  setSuppliedToShow(false);
                }}
              ></button>
            </div>
          </div>
        </div>

        <ModalBody
          style={{
            marginTop: "-1rem",
            minHeight: "35rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="col">
              <Select
                value={SuppliedTo}
                onChange={handleSelectChangeSuppliedTo}
                options={SuppliedToOptions}
                isSearchable={true}
                styles={{
                  menu: (provided) => ({
                    ...provided,
                  }),
                }}
                placeholder="-- Select --"
              />
            </div>
          </div>
          <div
            style={{ overflowY: "scroll", height: "31.5rem" }}
            className="row pt-1"
          >
            {Data.map((d, idx) => (
              <div className="px-3 pb-4">
                <div className="mt-3">
                  <div style={{ backgroundColor: "#b6fcd5" }} className="p-3">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="pt-2">
                        <h6>
                          Total Components Purchased : {TotalComponents[idx]}
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
                              <h6 className="d-inline ps-1">View Invoice</h6>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    {d.items &&
                      d.items.map((item) => (
                        <div className="col-4 mt-4">
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
                      {d.updated_date.split(" ").slice(0, 4).join(" ")} |
                      Updated Time :{" "}
                      {d.updated_date.split(" ").slice(4).join(" ")}
                    </h6>
                  </div>
                </div>
              </div>
            ))}
            {Data.length === 0 && (
              <div className="pt-3">
                <h5>Select Supplied To</h5>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          {Data.length !== 0 && (
            <div
              onClick={handleGeneratePdfSuppliedTo}
              style={{ width: "100%" }}
              className="btn btn-primary"
            >
              <h5>Download Report</h5>
            </div>
          )}
        </ModalFooter>
      </Modal>

      <div
        style={{ display: "flex", justifyContent: "center" }}
        className="px-4 pt-2"
      >
        <form style={{ width: "55%" }}>
          <div className="row mt-3">
            <div className="col-auto mt-1">
              <label for="FromDate">
                <h5>From Date</h5>
              </label>
            </div>
            <div className="col">
              <input
                required
                style={{ border: "1px solid black" }}
                value={FromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                }}
                type="date"
                class="form-control"
              ></input>
            </div>
            <div className="col-auto mt-1">
              <label for="ToDate">
                <h5>To Date</h5>
              </label>
            </div>
            <div className="col">
              <input
                required
                style={{ border: "1px solid black" }}
                value={ToDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                }}
                type="date"
                class="form-control"
              ></input>
            </div>
          </div>
          {FromDate !== null &&
            ToDate !== null &&
            ToDate !== "" &&
            FromDate !== "" && (
              <div>
                <div className="row mt-4">
                  <div
                    style={{ borderRadius: "0" }}
                    className="btn btn-info col"
                    onClick={() => {
                      setComponentsShow(true);
                    }}
                  >
                    <h5 className="pt-1">Get Component Report</h5>
                  </div>
                  <div
                    style={{ borderRadius: "0" }}
                    className="btn btn-success col"
                    onClick={() => {
                      setVendorsShow(true);
                    }}
                  >
                    <h5 className="pt-1">Get Vendor Report</h5>
                  </div>
                  <div
                    style={{ borderRadius: "0" }}
                    className="btn btn-warning col"
                    onClick={() => {
                      setSuppliedToShow(true);
                    }}
                  >
                    <h5 className="pt-1">Get Supplied To Report</h5>
                  </div>
                </div>
              </div>
            )}
        </form>
      </div>
    </div>
  );
}

export default SearchByDate;
