import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// ... resten av komponenten din som før

// 👇 Endringen er HER: flyttet eksporten ned
function LagGenerator() {
  // ... hele komponentinnholdet ditt (uendret)
}

export default LagGenerator;
