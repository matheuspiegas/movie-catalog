"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export function MyListsPage() {
  const lists = Array.from({ length: 3 }).map((_, i) => ({
    id: i,
    name: `My List ${i + 1}`,
    itemCount: (i + 1) * 5,
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Lists</h1>
        <Button>Create New List</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {lists.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <CardTitle>{list.name}</CardTitle>
              <CardDescription>{list.itemCount} items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex -space-x-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <img
                    key={i}
                    className="w-16 h-24 object-cover rounded border-2 border-primary"
                    src={`https://via.placeholder.com/100x150?text=Movie${i}`}
                    alt="Movie poster"
                  />
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/list/${list.id}`}>
                <Button>View</Button>
              </Link>
              <div>
                <Button variant="outline" size="sm" className="mr-2">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
