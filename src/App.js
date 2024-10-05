import "bootstrap/dist/css/bootstrap.min.css";
import HomeLayout from "./homelayout/HomeLayout";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./homepage/HomePage";
import AddComponents from "./addcomponents/AddComponents";
import History from "./history/History";
import SearchByVendor from "./searchbyvendor/SearchByVendor";
import SearchByComponent from "./searchbycomponent/SearchByComponent";
import SearchByInvoice from "./searchbyinvoice/SearchByInvoice";
import SearchBySuppliedTo from "./searchbysuppliedto/SearchBySuppliedTo";
import SearchByDate from "./searchbydate/SearchByDate";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <HomeLayout />,
      children: [
        {
          path: "/",
          element: <HomePage />,
        },
        {
          path: "/searchbyvendor",
          element: <SearchByVendor />,
        },
        {
          path: "/searchbycomponent",
          element: <SearchByComponent />,
        },
        {
          path: "/searchbyinvoice",
          element: <SearchByInvoice />,
        },
        {
          path: "/searchbysuppliedto",
          element: <SearchBySuppliedTo />,
        },
        {
          path: "/searchbydate",
          element: <SearchByDate />,
        },
        {
          path: "/addcomponents",
          element: <AddComponents />,
        },
        {
          path: "/history",
          element: <History />,
        },
      ],
    },
  ]);

  return (
    <div className="App ">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
