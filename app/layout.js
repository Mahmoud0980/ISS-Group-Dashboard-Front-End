// import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap-icons/font/bootstrap-icons.css";
import BootstrapJS from "./_components/BootstrapJS";
// import Sidebar from "./_components/Sidebar/Sidebar";
// import "./globals.css";

// export const metadata = {
//   title: "ISS Group - Dashboard",
//   description: "",
//   icons: {
//     icon: "/logo.jpg",
//   },
// };
// export default function RootLayout({ children }) {
//   return (
//     <html lang="en" dir="rtl">
//       <body>
//         <Sidebar />
//         <div className="page-content" style={{ marginRight: "275px" }}>
//           {children}
//         </div>
//         <BootstrapJS />
//       </body>
//     </html>
//   );
// }
// app/layout.js
import LayoutWrapper from "./_components/LayoutWrapper";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

export const metadata = {
  title: "ISS Group - Dashboard",
  icons: { icon: "/logo.jpg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="rtl">
      <body style={{ backgroundColor: "#f8fefe" }}>
        <LayoutWrapper>{children}</LayoutWrapper>
        <BootstrapJS />
      </body>
    </html>
  );
}
