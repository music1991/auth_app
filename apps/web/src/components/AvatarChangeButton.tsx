"use client";

import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";

interface AvatarChangeButtonProps {
  onAction: () => void;
}

export const AvatarChangeButton: React.FC<AvatarChangeButtonProps> = ({ onAction }) => {
  return (
    <Button variant="outline" onClick={onAction} className="">
      <ImageIcon className="mr-2 h-4 w-4" />
      Update Photo
    </Button>
  );
}
