import { Navigate } from "react-router-dom";

// Legacy /siswa/pembayaran redirects ke /siswa/invoice
export default function SiswaPembayaran() {
  return <Navigate to="/siswa/invoice" replace />;
}
