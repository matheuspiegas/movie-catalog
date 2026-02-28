"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import Link from "next/link"

const searchSchema = z.object({
  query: z.string().min(1, "Required"),
})

export function SearchPersonPage() {
  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
    },
  })

  const people = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    name: `Actor ${i + 1}`,
    profile_path: "https://placehold.co/500x750",
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search People</h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => console.log(data))}
            className="flex gap-2"
          >
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Search for a person..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Search</Button>
          </form>
        </Form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {people.map((person) => (
          <Card key={person.id}>
            <CardHeader>
              <img
                src={person.profile_path}
                alt={person.name}
                className="rounded-t-lg"
              />
            </CardHeader>
            <CardContent>
              <CardTitle>{person.name}</CardTitle>
            </CardContent>
            <CardFooter>
              <Link href={`/person/${person.id}`} className="w-full">
                <Button className="w-full">Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
