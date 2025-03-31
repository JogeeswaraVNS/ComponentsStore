import { Autocomplete, TextField } from "@mui/material";
import React, { useEffect, useState, useContext } from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Modal, ModalBody, ModalFooter } from "react-bootstrap";
import DeleteIcon from "@mui/icons-material/Delete";
import Button from "react-bootstrap/Button";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import Select from "react-select";
import { logincontext } from "../contextapi/contextapi";
import axios from "axios";

function AddComponents() {

  const [loginUser, setLoginUser] = useContext(logincontext);

  const [components, setComponents] = useState([]);

  const [file, setFile] = useState(null);

  const [fileSizeError,setFileSizeError]=useState(false)

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const [addcomponent, setaddcomponent] = useState(false);

  const [selectedsubmit, setselectedsubmit] = useState(false);

  const [status, setstatus] = useState(null);

  const [selectedVendor, setSelectedVendor] = useState("");

  const [selectedComponentPurchased, setSelectedComponentPurchased] =
    useState(null);

  const [QuantityPurchased, setQuantityPurchased] = useState(0);

  const [PurchasedPrice, setPurchasedPrice] = useState(null);

  const [PurchasedDate, setPurchasedDate] = useState(null);

  const [StockEntry, setStockEntry] = useState(null);

  const [InvoiceNo, setInvoiceNo] = useState(null);

  const [editShow, seteditShow] = useState(false);

  const [delShow, setdelShow] = useState(false);

  const [editID, seteditID] = useState(null);

  const [delID, setdelID] = useState(null);

  const [suppliedToOptions, setSuppliedToOptions] = useState([]);

  const [selectedOption, setSelectedOption] = useState(null);

  const [customOption, setCustomOption] = useState("");

  const [isOtherSelected, setIsOtherSelected] = useState(false);


  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/get/options")
      .then((response) => {
        const options = response.data.map((option) => ({
          value: option,
          label: option,
        }));
        setSuppliedToOptions([
          ...options,
          { value: "Others", label: "Others" },
        ]);
      })
      .catch((error) => {
        console.error("Error fetching supplied to options:", error);
      });
  }, []);

  const handleSelectChange = (selectedOption) => {
    setSelectedOption(selectedOption);

    if (selectedOption.value === "Others") {
      setIsOtherSelected(true);
    } else {
      setIsOtherSelected(false);
      setCustomOption("");
    }
  };

  const clearall = () => {
    setSelectedComponentPurchased("");
    setQuantityPurchased(0);
    setPurchasedPrice("");
    setStockEntry("");
  };


  const handlesubmit = () => {
  
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  
    if (file.size > maxSize) {
      console.log("yes")
      setFileSizeError(true);
      setselectedsubmit(true)
      return;
    }
    else
    {
    const formData = new FormData();
    setFileSizeError(false)
   
    formData.append("file", file);
    formData.append("vendor", selectedVendor);
    formData.append("PurchasedDate", PurchasedDate);
    formData.append("InvoiceNo", InvoiceNo);
    formData.append("components", JSON.stringify(components));
    formData.append(
      "suppliedTo",
      selectedOption?.value === "Others" ? customOption : selectedOption?.value
    );
    formData.append("user_id", loginUser.user_id);
  
    axios
      .post("http://localhost:5000/purchasedcomponents/postall", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) =>{setstatus(201)}) // Use `r.status` instead of `r.data`
      .catch((err) =>{setstatus(400 || 500)}); // Handle `undefined` response
  
    setselectedsubmit(true);
    }
  };
  
  const handleadd = () => {
    if (
      selectedComponentPurchased !== null &&
      QuantityPurchased !== 0 &&
      PurchasedDate !== null &&
      StockEntry !== null
    ) {
      setComponents([
        ...components,
        {
          selectedComponentPurchased: selectedComponentPurchased,
          QuantityPurchased: QuantityPurchased,
          PurchasedPrice: PurchasedPrice,
          StockEntry: StockEntry,
        },
      ]);
      clearall();
    } else {
      setstatus(400);
    }
  };

  const handledeletecomponent = () => {
    components.splice(delID, 1);
    clearall();
  };

  const handleeditcomponent = () => {
    components[editID].selectedComponentPurchased = selectedComponentPurchased;
    components[editID].QuantityPurchased = QuantityPurchased;
    components[editID].PurchasedPrice = PurchasedPrice;
    components[editID].StockEntry = StockEntry;
  };

  return (
    <div>
      <Modal
        show={selectedsubmit}
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
              onClick={() => setselectedsubmit(false)}
            ></button>
          </div>
        </div>

        <ModalBody style={{ marginTop: "-2rem", marginBottom: "1.5rem" }}>
          {status === 201 && (
            <div>
              <div>
                <svg
                  style={{ display: "block", margin: "auto" }}
                  fill="#198754"
                  xmlns="http://www.w3.org/2000/svg"
                  height="100"
                  width="100"
                  viewBox="0 0 512 512"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
                </svg>
              </div>

              <h3 style={{ textAlign: "center" }} className="text-success mt-3">
                Successfully Component(s) Added to the Database
              </h3>
            </div>
          )}

          {status === 400 && (
            <div>
              <div>
                <svg
                  style={{ display: "block", margin: "auto" }}
                  fill="#dc3545"
                  xmlns="http://www.w3.org/2000/svg"
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

          {fileSizeError && (
            <div>
              <div>
                <svg
                  style={{ display: "block", margin: "auto" }}
                  fill="#dc3545"
                  xmlns="http://www.w3.org/2000/svg"
                  height="100"
                  width="100"
                  viewBox="0 0 512 512"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" />
                </svg>
              </div>

              <h3 style={{ textAlign: "center" }} className="text-danger mt-3">
                File size exceeds 5MB. Please upload a smaller file.
              </h3>
            </div>
          )}


          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              className="btn btn-primary mt-4"
              onClick={() => {
                setselectedsubmit(false);
                if (status === 201) {
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
        show={addcomponent}
        backdrop="static"
        centered
        className="modal-lg"
      >
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <h4 className="pt-4 ps-4">Add Your Component</h4>
          <div style={{ marginRight: "auto" }}></div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-close pt-5 pe-5"
              type="button"
              onClick={() => setaddcomponent(false)}
            ></button>
          </div>
        </div>

        <ModalBody style={{ marginBottom: "1rem" }}>
          <div className="px-2">
            <form>
              <div class="mb-3">
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
              </div>
              <button
                type="button"
                onClick={() => {
                  setaddcomponent(false);
                  handleadd();
                }}
                class="btn btn-primary mt-2"
              >
                Add Component
              </button>
            </form>
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
              onClick={() => {
                clearall();
                seteditShow(false);
              }}
            ></button>
          </div>
        </div>
        <ModalBody>
          <div className="px-2">
            <form>
              <div class="mb-3">
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
                clearall();
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
                // handlesubmit();
                handleeditcomponent();
                clearall();
                seteditShow(false);
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
              onClick={() => {
                clearall();
                setdelShow(false);
              }}
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
                {PurchasedPrice}rs
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
              onClick={() => {
                clearall();
                setdelShow(false);
              }}
            >
              <CloseIcon
                style={{ height: "1.5rem", width: "1.5rem" }}
              ></CloseIcon>
            </button>
            <button
              style={{ borderRadius: "50%" }}
              className="btn btn-danger p-2 me-2 ms-3"
              onClick={() => {
                handledeletecomponent();
                setdelShow(false);
                // setdelsubmitstatus(true);
              }}
            >
              <DoneIcon
                style={{ height: "1.5rem", width: "1.5rem" }}
              ></DoneIcon>
            </button>
          </div>
        </ModalFooter>
      </Modal>

      <h4 className="text-center pt-4 mb-4">Add Components Here</h4>
      <div style={{ display: "flex", justifyContent: "center" }} className="">
        <form style={{ width: "55%" }}>
          <div class="mb-3">
            <div className="row">
              <div className="col-auto mt-1">
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
                  onChange={(event) => {
                    setSelectedVendor(event.target.value);
                  }}
                ></input>
              </div>
            </div>
            <div className="row mt-3">
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
            </div>
            <div class="row my-4">
              <div className="col-auto mt-2">
                <label for="StockEntry">
                  <h5>Invoice No</h5>
                </label>
              </div>
              <div className="col mt-1">
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
              <div className="col mt-1">
                <input
                  className="form-control btn btn-outline-dark"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-auto mt-1">
              <label for="supplied-to" class="form-label">
                <h5 className="mb-3 mt-1">Supplied To</h5>
              </label>
            </div>
            <div className="col">
              <Select
                value={selectedOption}
                onChange={handleSelectChange}
                options={suppliedToOptions}
                isSearchable={true}
                styles={{
                  menu: (provided) => ({
                    ...provided,
                  }),
                }}
                placeholder="-- Select --"
              />
            </div>
            {isOtherSelected && (
              <div className="col-auto">
                <div className="row">
                  <div className="col-auto">
                    <label for="custom-supplied-to" class="form-label">
                      <h5 className="mt-2">Specify Other</h5>
                    </label>
                  </div>
                  <div className="col-auto">
                    <input
                      style={{ border: "1px solid black" }}
                      className="form-control"
                      type="text"
                      id="custom-supplied-to"
                      value={customOption}
                      onChange={(e) => setCustomOption(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={
              selectedVendor.length === 0 ||
              PurchasedDate === null ||
              InvoiceNo === null
            }
            style={{ width: "100%" }}
            onClick={() => {
              setaddcomponent(true);
            }}
            class="btn btn-primary pt-2"
          >
            <h5>Add Component</h5>
          </button>
        </form>
      </div>
      {components.length === 0 ? null : (
        <div className="container">
          <div style={{ overflowY: "scroll", height: "18rem" }} className="row">
            {components.map((d, idx) => (
              <div className="col-3 mt-4 px-3 pb-2">
                <div className="card">
                  <div
                    className="p-3"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      backgroundColor: "#f4e9e3",
                    }}
                  >
                    <h6>{d.selectedComponentPurchased}</h6>
                  </div>

                  <div className="card-body">
                    <h6>Quantity : {d.QuantityPurchased}</h6>
                    <h6>Purchased Price : {d.PurchasedPrice}rs</h6>
                    <h6>Stock Entry : {d.StockEntry}</h6>
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
                            setSelectedComponentPurchased(
                              components[idx].selectedComponentPurchased
                            );
                            setQuantityPurchased(
                              components[idx].QuantityPurchased
                            );
                            setPurchasedPrice(components[idx].PurchasedPrice);
                            setStockEntry(components[idx].StockEntry);
                            seteditShow(true);
                            seteditID(idx);
                          }}
                          className="btn btn-primary p-2"
                        >
                          <EditIcon
                            style={{ height: "1.5rem", width: "1.5rem" }}
                          ></EditIcon>
                          {/* <h6 className="d-inline ms-2">Edit</h6> */}
                        </Button>
                      </div>
                      <div>
                        <Button
                          style={{ borderRadius: "50%" }}
                          onClick={() => {
                            setSelectedComponentPurchased(
                              components[idx].selectedComponentPurchased
                            );
                            setQuantityPurchased(
                              components[idx].QuantityPurchased
                            );
                            setPurchasedPrice(components[idx].PurchasedPrice);
                            setStockEntry(components[idx].StockEntry);
                            setdelShow(true);
                            setdelID(idx);
                          }}
                          className="btn btn-danger p-2"
                        >
                          <DeleteIcon
                            style={{ height: "1.5rem", width: "1.5rem" }}
                          ></DeleteIcon>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {components.length === 0 ? null : (
        <div
          className="mt-3"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <form style={{ width: "55%" }}>
            <button
              style={{ width: "100%" }}
              type="button"
              disabled={selectedVendor.length === 0}
              onClick={() => {
                handlesubmit();
              }}
              class="btn btn-success pt-2"
            >
              <h5>Add to the Database</h5>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AddComponents;
