import Button from '@/components/ui/button';
import React, { Dispatch, SetStateAction, useState } from 'react'
import toast from 'react-hot-toast';

type CreateUserData = {
    userName: string;
    fullName: string;
    phone: string;
};


export default function CreateUserForm({ setUserCreated }: { setUserCreated: Dispatch<SetStateAction<boolean>> }) {
    const [formData, setFormData] = useState<CreateUserData>({
        userName: "",
        fullName: "",
        phone: "",
    });

    const [loading, setLoading] = useState(false);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setLoading(true);
            const resp = window.api.createUser(formData);
            toast.promise(resp, {
                loading: 'Saving your changes...',
                success: 'User created successfully!',
                error: 'Failed in creating user ',
            });
            setUserCreated((prev) => !prev)
        }
        catch (error) {
            toast.error("something went wrong")
        } finally {
            setLoading(false);
            setFormData({
                userName: "",
                fullName: "",
                phone: "",
            })
        }
    };

    return (
        <div className="mx-auto w-full max-w-lg">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-foreground">
                    Create User
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    Add a new user to the system.
                </p>
            </div>

            {/* Form */}
            <div className="rounded-2xl border-y bg-card p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div>
                        <label
                            htmlFor="userName"
                            className="mb-2 block text-sm font-medium text-muted-foreground"
                        >
                            Username
                        </label>

                        <input
                            id="userName"
                            name="userName"
                            type="text"
                            placeholder="dk"
                            value={formData.userName}
                            onChange={handleChange}
                            required
                            className="w-full border-y border-t-white/30 border-b-white/30  bg-foreground/10 p-3 outline-none rounded-full transform-gpu  duration-300 ease-out focus:translate-z-6 focus:shadow-lg shadow-black/30 "
                        />
                    </div>

                    {/* Full Name */}
                    <div>
                        <label
                            htmlFor="fullName"
                            className="mb-2 block text-sm font-medium text-muted-foreground"
                        >
                            Full Name
                        </label>

                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            placeholder="Deepak Kumar"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full border-y border-t-white/30 border-b-white/30  bg-foreground/10 p-3 outline-none rounded-full transform-gpu  duration-300 ease-out focus:translate-z-6 focus:shadow-lg shadow-black/30 "
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label
                            htmlFor="phone"
                            className="mb-2 block text-sm font-medium text-muted-foreground"
                        >
                            Phone Number
                        </label>

                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="7814897900"
                            value={formData.phone}
                            onChange={handleChange}
                            maxLength={10}
                            pattern="[0-9]{10}"
                            required
                            className="w-full border-y border-t-white/30 border-b-white/30  bg-foreground/10 p-3 outline-none rounded-full transform-gpu  duration-300 ease-out focus:translate-z-6 focus:shadow-lg shadow-black/30 "
                        />
                        <p className="mt-1.5 text-xs text-gray-500">
                            Enter a 10-digit phone number.
                        </p>
                    </div>

                    {/* Submit */}
                    <Button
                        disabled={loading}
                        className="bg-linear-b from-primary to-primary w-full  text-black"
                    >
                        {loading ? "Creating User..." : "Create User"}
                    </Button>
                </form>
            </div>
        </div>
    )
}