"use client";

import { useEffect } from "react";

export default function BootstrapJS() {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle");
  }, []);
  return null;
}
