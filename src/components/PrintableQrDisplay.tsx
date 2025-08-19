
'use client';

import { Button } from "./ui/button";
import { Download, Loader2 } from "lucide-react";
import { AlertDialogFooter, AlertDialogCancel } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState, useRef, useEffect } from "react";

interface PrintableQrDisplayProps {
    boxName: string;
    businessId: string;
    qrDataURL: string | undefined;
    onClose: () => void;
}

// Hardcoded base64 logo to prevent any CORS issues forever.
const coraboLogoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAA8CAMAAAB1a982AAAAbFBMVEUAAAAA//8AnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwAnuwdouwAnuwAnuwAnuwAm+oAm+oAnuwAnuwAnuwAnuwAnuwAl+sAnuwAm+oAnuwAnuwAnuwAnuwAnuxKq/H///8i2fa2AAAAI3RSTlMAwEC/f3+AIGAwv78Q75AgYFC/QKAwUP+AYI/vP0DfcM+fVfHlAAAAA1hJREFUeNrt2kGOwkAQRFGICYgi4g7u/w7HCXSBgY5Tqa2t1V4n9g7A9wzDfnsCslxw4qLliIuWIy5ajrhocR8XLYdcNB1x0XTERctRlzIuWou4aLbiwMUl4sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJ+LAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFJeLAxSXiIMXl7sDFp3DhL3BxcYg4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4cHGJOMhxcmdwcYk4c-gVwAAAABJRU5ErkJggg==";

export const PrintableQrDisplay = ({ boxName, businessId, qrDataURL, onClose }: PrintableQrDisplayProps) => {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawCanvasContent = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !qrDataURL) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = 400;
        const height = 635;
        canvas.width = width;
        canvas.height = height;

        // Create a new promise for each image to ensure it's loaded before drawing
        const loadImage = (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        };

        // Chain all image loading promises
        Promise.all([
            loadImage(coraboLogoBase64),
            loadImage(qrDataURL)
        ]).then(([logoImg, qrImg]) => {
            // Draw background
            ctx.fillStyle = '#E3F2FD'; // Light blue background
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(width - 20, 0);
            ctx.quadraticCurveTo(width, 0, width, 20);
            ctx.lineTo(width, height - 20);
            ctx.quadraticCurveTo(width, height, width - 20, height);
            ctx.lineTo(20, height);
            ctx.quadraticCurveTo(0, height, 0, height - 20);
            ctx.lineTo(0, 20);
            ctx.quadraticCurveTo(0, 0, 20, 0);
            ctx.closePath();
            ctx.fill();
            
            // Draw Corabo Logo
            ctx.drawImage(logoImg, (width - 256) / 2, 40, 256, 40);

            // Draw Texts
            ctx.fillStyle = '#1E3A8A'; // Dark blue text
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paga a tu Ritmo con Corabo', width / 2, 140);

            // Draw White Box for QR
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect((width - 220) / 2, 170, 220, 220);

            // Draw QR Code
            ctx.drawImage(qrImg, (width - 200) / 2, 180, 200, 200);

            // Draw Bottom Text
            ctx.fillStyle = '#1E3A8A';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(`Caja: ${boxName}`, width / 2, 560);
            ctx.font = '16px Arial';
            ctx.fillText(`ID Negocio: ${businessId}`, width / 2, 590);

        }).catch(err => {
            console.error("Error loading images for canvas: ", err);
            toast({ variant: 'destructive', title: 'Error de imagen', description: 'No se pudieron cargar las imágenes para el QR.' });
        });
    }, [qrDataURL, boxName, businessId, toast]);

    useEffect(() => {
        // Draw the canvas as soon as the component is ready and qrDataURL is available
        drawCanvasContent();
    }, [drawCanvasContent]);
    
    const downloadQR = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo encontrar el canvas." });
            return;
        }
        setIsDownloading(true);
        try {
            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `QR-Caja-${boxName.replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Descarga Exitosa", description: "Tu código QR se ha descargado." });
            onClose();
        } catch (error) {
            console.error("Error downloading canvas:", error);
            toast({ variant: "destructive", title: "Error de Descarga", description: "No se pudo generar el PNG." });
        } finally {
            setIsDownloading(false);
        }
    }, [boxName, onClose, toast]);

    return (
        <div className="flex flex-col items-center gap-4 bg-background p-6 rounded-lg shadow-lg">
            {/* The canvas for display and download */}
            <canvas ref={canvasRef} style={{ maxWidth: '300px' }}/>

            <AlertDialogFooter className="sm:justify-between w-full">
                <AlertDialogCancel onClick={onClose}>Cerrar</AlertDialogCancel>
                <Button onClick={downloadQR} disabled={isDownloading || !qrDataURL}>
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isDownloading ? 'Generando...' : 'Descargar PNG'}
                </Button>
            </AlertDialogFooter>
        </div>
    );
};
