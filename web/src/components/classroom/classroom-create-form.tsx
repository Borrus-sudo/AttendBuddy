import { useState, type FormEvent } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";

type ClassroomCreateFormProps = {
    onCreate: (input: { name: string; description: string }) => Promise<void>;
    isLoading: boolean;
};

export function ClassroomCreateForm({
    onCreate,
    isLoading,
}: ClassroomCreateFormProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        await onCreate({
            name: name.trim(),
            description: description.trim(),
        });

        setName("");
        setDescription("");
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <Label htmlFor="create-name">Classroom Name</Label>
                <Input
                    id="create-name"
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value);
                    }}
                    placeholder="DSA Lab A"
                    required
                    maxLength={120}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                    id="create-description"
                    value={description}
                    onChange={(event) => {
                        setDescription(event.target.value);
                    }}
                    placeholder="Attendance for semester VI practical batch"
                    maxLength={1000}
                />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner /> : null}
                {isLoading ? "Creating..." : "Create Classroom"}
            </Button>
        </form>
    );
}
