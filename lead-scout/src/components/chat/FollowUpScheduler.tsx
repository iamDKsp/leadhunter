import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Bell, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export interface FollowUp {
    id: string;
    leadId: string;
    leadName: string;
    date: Date;
    time: string;
    type: "call" | "message" | "email" | "meeting";
    note: string;
    completed: boolean;
}

interface FollowUpSchedulerProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    leadName: string;
    onSchedule: (followUp: FollowUp) => void;
}

const followUpTypes = [
    { value: "call", label: "Ligação", icon: "📞" },
    { value: "message", label: "Mensagem WhatsApp", icon: "💬" },
    { value: "email", label: "E-mail", icon: "📧" },
    { value: "meeting", label: "Reunião", icon: "🤝" },
];

const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

export const FollowUpScheduler = ({
    isOpen,
    onClose,
    leadId,
    leadName,
    onSchedule,
}: FollowUpSchedulerProps) => {
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState<string>("");
    const [type, setType] = useState<string>("");
    const [note, setNote] = useState("");

    const handleSchedule = () => {
        if (!date || !time || !type) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha a data, horário e tipo do follow-up.",
                variant: "destructive",
            });
            return;
        }

        const followUp: FollowUp = {
            id: `fu-${Date.now()}`,
            leadId,
            leadName,
            date,
            time,
            type: type as FollowUp["type"],
            note,
            completed: false,
        };

        onSchedule(followUp);

        toast({
            title: "Follow-up agendado!",
            description: `Lembrete para ${leadName} em ${format(date, "dd/MM/yyyy", { locale: ptBR })} às ${time}`,
        });

        // Reset form
        setDate(undefined);
        setTime("");
        setType("");
        setNote("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Bell className="h-5 w-5 text-primary" />
                        Agendar Follow-up
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Lead info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                            <span className="font-semibold text-primary">
                                {leadName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{leadName}</p>
                            <p className="text-xs text-muted-foreground">Lead selecionado</p>
                        </div>
                    </div>

                    {/* Date picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Data</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-input border-border",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Time picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Horário</label>
                        <Select value={time} onValueChange={setTime}>
                            <SelectTrigger className="bg-input border-border">
                                <SelectValue placeholder="Selecione o horário">
                                    {time && (
                                        <span className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {time}
                                        </span>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border max-h-60">
                                {timeSlots.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                        {slot}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Tipo</label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="bg-input border-border">
                                <SelectValue placeholder="Tipo de contato" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                {followUpTypes.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        <span className="flex items-center gap-2">
                                            <span>{t.icon}</span>
                                            {t.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Observação (opcional)</label>
                        <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ex: Apresentar proposta de serviço premium..."
                            className="bg-input border-border resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button onClick={handleSchedule} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Check className="h-4 w-4 mr-2" />
                        Agendar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
