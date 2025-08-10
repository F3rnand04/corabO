
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, FileText, Menu, Search, LogOut, User, ShoppingCart, Plus, Minus, X, Wallet, Truck, Star, History as HistoryIcon, Shield, HelpCircle, UserRound, Contact } from "lucide-react";
import { useCorabo } from "@/contexts/CoraboContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { credicoraLevels, type User as UserType } from "@/lib/types";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
  const { searchQuery, setSearchQuery, feedView, setFeedView, currentUser, users, toggleGps, cart, updateCartQuantity, getCartTotal, checkout, getDeliveryCost, logout }