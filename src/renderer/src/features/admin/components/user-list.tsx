import { useEffect, useMemo, useState } from "react";
import { User } from "./UserSelector";
import { Menu, Search, UserX } from "lucide-react";
import UserNotFoundInList from "@/components/ui/user-not-found-in-list";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Props = {
    onSelect?: (user: User) => void;
    userCreated: boolean
};

export default function UserList({ onSelect, userCreated }: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);


    const handleInactiveUser = async (userId: string) => {
        setOpenMenuId(null);
        const toastId = toast.loading("Inactivating user")
        try {
            await window.api.deactivateUser({ userId });
            toast.success("User inactivated successfully", {
                id: toastId,
            });
        } catch (error) {
            toast.error("Failed to inactive user", {
                id: toastId,
            });
            console.error("Failed to inactive user:", error);
        } finally {
            setLoadingUsers(true);
            const res = await window.api.listUser();
            console.log(res)
            if (res.success && res.data) {
                setUsers(res.data);
            }
            setLoadingUsers(false);
        }
    };

    const handleActiveUser = async (userId: string) => {
        setOpenMenuId(null);

        try {
            await window.api.activateUser({ userId });
        } catch (error) {
            console.error("Failed to active user:", error);
        } finally {
            setLoadingUsers(true);
            const res = await window.api.listUser();
            if (res.success && res.data) {
                setUsers(res.data);
            }
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);

            try {
                const res = await window.api.listUser();

                if (res.success && res.data) {
                    setUsers(res.data);
                }
            } catch (err) {
                console.error("Failed to load users:", err);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [userCreated]);

    const filteredUsers = useMemo(() => {
        const query = search.toLowerCase().trim();

        if (!query) return users;

        return users.filter(
            (user) =>
                user.userName.toLowerCase().includes(query) ||
                user.fullName.toLowerCase().includes(query) ||
                user.phone?.includes(query),
        );
    }, [users, search]);

    const handleSelect = (user: User) => {
        setSelectedUserId(user.id);
        onSelect?.(user);
    };

    const getInitials = (user: User) => {
        if (user.fullName) {
            return user.fullName
                .split(" ")
                .slice(0, 2)
                .map((name) => name[0])
                .join("")
                .toUpperCase();
        }

        return user.userName.slice(0, 2).toUpperCase();
    };

    return (
        <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-foreground">
                            Users
                        </h2>

                        <p className="text-sm text-gray-500">
                            {users.length} {users.length === 1 ? "user" : "users"}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 w-full rounded-full  bg-card pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 border-y border-y-border"
                    />
                </div>
            </div>

            {/* User list */}
            <div className=" rounded-2xl  bg-card">
                {loadingUsers ? (
                    <div className="divide-y divide-white/20">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-4"
                            >
                                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200/20" />

                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-28 animate-pulse rounded bg-gray-200/20" />
                                    <div className="h-3 w-40 animate-pulse rounded bg-gray-100/20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <UserNotFoundInList search={search.trim().length > 0 ? true : false} />
                ) : (
                    <div className="max-h-120 overflow-y-auto bg-card border-y rounded-2xl hide-scroll">
                        {filteredUsers.map((user) => {
                            const isMenuOpen = openMenuId === user.id;

                            return (
                                <div
                                    key={user.id}
                                    className="relative flex w-full items-center gap-3 border-b border-gray-100/20 p-4 text-left transition last:border-b-0 hover:bg-gray-50/10"
                                >
                                    {/* User clickable area */}
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(user)}
                                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-gray-700",

                                                user.isActive ? "bg-gray-200" : "bg-red-400  "
                                            )}
                                        >
                                            {getInitials(user)}
                                        </div>

                                        {/* User info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {user.fullName}
                                            </p>

                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                @{user.userName}
                                                {user.phone && ` · ${user.phone}`}
                                            </p>
                                        </div>
                                    </button>

                                    {/* Menu */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenMenuId(isMenuOpen ? null : user.id)
                                            }
                                            className="rounded-full p-2 transition hover:bg-gray-50/10"
                                        >
                                            <Menu className="h-5 w-5" />
                                        </button>

                                        {/* Dropdown */}
                                        {isMenuOpen && (
                                            <div
                                                className="absolute right-0 top-11 z-50 w-44 overflow-hidden
                rounded-full border border-border bg-card p-1 shadow-xl"
                                            >
                                                {/* Inactive */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (user.isActive) {
                                                            handleInactiveUser(user.id)
                                                        } else {
                                                            handleActiveUser(user.id)
                                                        }
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-full px-3 py-2.5
                  text-sm text-foreground transition hover:bg-muted-foreground"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                    {
                                                        user.isActive ? (
                                                            <span>Inactivate user</span>
                                                        ) : <span>Activate user</span>
                                                    }
                                                </button>


                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
                }
            </div >
        </div >
    );
}