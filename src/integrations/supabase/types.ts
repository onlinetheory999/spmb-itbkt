export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          aksi: string
          created_at: string
          detail: Json | null
          entitas: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          aksi: string
          created_at?: string
          detail?: Json | null
          entitas?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          aksi?: string
          created_at?: string
          detail?: Json | null
          entitas?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          aktif: boolean
          created_at: string
          cta_link: string | null
          cta_text: string | null
          id: string
          image_url: string | null
          judul: string
          subjudul: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          judul: string
          subjudul?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          judul?: string
          subjudul?: string | null
          urutan?: number
        }
        Relationships: []
      }
      jadwal: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          jenjang: Database["public"]["Enums"]["jenjang_type"] | null
          judul: string
          tanggal: string
          tanggal_selesai: string | null
          waktu: string | null
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang_type"] | null
          judul: string
          tanggal: string
          tanggal_selesai?: string | null
          waktu?: string | null
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang_type"] | null
          judul?: string
          tanggal?: string
          tanggal_selesai?: string | null
          waktu?: string | null
        }
        Relationships: []
      }
      jenjang: {
        Row: {
          biaya: number
          created_at: string
          deskripsi: string | null
          id: string
          jadwal_seleksi: string | null
          kode: Database["public"]["Enums"]["jenjang_type"]
          kode_va: string | null
          kuota: number
          kuota_l: number
          kuota_p: number
          nama: string
          status: Database["public"]["Enums"]["status_pendaftaran"]
          updated_at: string
        }
        Insert: {
          biaya?: number
          created_at?: string
          deskripsi?: string | null
          id?: string
          jadwal_seleksi?: string | null
          kode: Database["public"]["Enums"]["jenjang_type"]
          kode_va?: string | null
          kuota?: number
          kuota_l?: number
          kuota_p?: number
          nama: string
          status?: Database["public"]["Enums"]["status_pendaftaran"]
          updated_at?: string
        }
        Update: {
          biaya?: number
          created_at?: string
          deskripsi?: string | null
          id?: string
          jadwal_seleksi?: string | null
          kode?: Database["public"]["Enums"]["jenjang_type"]
          kode_va?: string | null
          kuota?: number
          kuota_l?: number
          kuota_p?: number
          nama?: string
          status?: Database["public"]["Enums"]["status_pendaftaran"]
          updated_at?: string
        }
        Relationships: []
      }
      pembayaran: {
        Row: {
          biaya: number
          catatan: string | null
          created_at: string
          id: string
          metode: string | null
          nomor_va: string
          siswa_id: string
          status: Database["public"]["Enums"]["status_bayar"]
          tanggal_bayar: string | null
          updated_at: string
        }
        Insert: {
          biaya: number
          catatan?: string | null
          created_at?: string
          id?: string
          metode?: string | null
          nomor_va: string
          siswa_id: string
          status?: Database["public"]["Enums"]["status_bayar"]
          tanggal_bayar?: string | null
          updated_at?: string
        }
        Update: {
          biaya?: number
          catatan?: string | null
          created_at?: string
          id?: string
          metode?: string | null
          nomor_va?: string
          siswa_id?: string
          status?: Database["public"]["Enums"]["status_bayar"]
          tanggal_bayar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      pengumuman: {
        Row: {
          created_at: string
          id: string
          isi: string
          judul: string
          penting: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          isi: string
          judul: string
          penting?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          isi?: string
          judul?: string
          penting?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nama: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nama: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          alamat: string | null
          email: string | null
          hero_image: string | null
          id: number
          kode_sekolah: string
          logo_url: string | null
          nama_sekolah: string
          no_telp: string | null
          status_pendaftaran: Database["public"]["Enums"]["status_pendaftaran"]
          tahun_ajaran: string
          updated_at: string
          warna_tema: string | null
        }
        Insert: {
          alamat?: string | null
          email?: string | null
          hero_image?: string | null
          id?: number
          kode_sekolah?: string
          logo_url?: string | null
          nama_sekolah?: string
          no_telp?: string | null
          status_pendaftaran?: Database["public"]["Enums"]["status_pendaftaran"]
          tahun_ajaran?: string
          updated_at?: string
          warna_tema?: string | null
        }
        Update: {
          alamat?: string | null
          email?: string | null
          hero_image?: string | null
          id?: number
          kode_sekolah?: string
          logo_url?: string | null
          nama_sekolah?: string
          no_telp?: string | null
          status_pendaftaran?: Database["public"]["Enums"]["status_pendaftaran"]
          tahun_ajaran?: string
          updated_at?: string
          warna_tema?: string | null
        }
        Relationships: []
      }
      siswa: {
        Row: {
          alamat: string | null
          asal_sekolah: string | null
          created_at: string
          email: string
          id: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kabupaten: string | null
          nama_lengkap: string
          no_hp: string | null
          nomor_peserta: string | null
          provinsi: string | null
          status_akun: Database["public"]["Enums"]["status_akun"]
          status_verifikasi: Database["public"]["Enums"]["status_verifikasi"]
          tahun_lulus: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alamat?: string | null
          asal_sekolah?: string | null
          created_at?: string
          email: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"]
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kabupaten?: string | null
          nama_lengkap: string
          no_hp?: string | null
          nomor_peserta?: string | null
          provinsi?: string | null
          status_akun?: Database["public"]["Enums"]["status_akun"]
          status_verifikasi?: Database["public"]["Enums"]["status_verifikasi"]
          tahun_lulus?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alamat?: string | null
          asal_sekolah?: string | null
          created_at?: string
          email?: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"]
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          kabupaten?: string | null
          nama_lengkap?: string
          no_hp?: string | null
          nomor_peserta?: string | null
          provinsi?: string | null
          status_akun?: Database["public"]["Enums"]["status_akun"]
          status_verifikasi?: Database["public"]["Enums"]["status_verifikasi"]
          tahun_lulus?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      upload_berkas: {
        Row: {
          akta: string | null
          created_at: string
          foto: string | null
          id: string
          ijazah: string | null
          kk: string | null
          pas_foto: string | null
          raport: string | null
          siswa_id: string
          updated_at: string
        }
        Insert: {
          akta?: string | null
          created_at?: string
          foto?: string | null
          id?: string
          ijazah?: string | null
          kk?: string | null
          pas_foto?: string | null
          raport?: string | null
          siswa_id: string
          updated_at?: string
        }
        Update: {
          akta?: string | null
          created_at?: string
          foto?: string | null
          id?: string
          ijazah?: string | null
          kk?: string | null
          pas_foto?: string | null
          raport?: string | null
          siswa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_berkas_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: true
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cek_kuota: { Args: { _jenjang: string; _jk: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "siswa"
      jenis_kelamin: "L" | "P"
      jenis_tagihan: "pendaftaran" | "daftar_ulang"
      jenjang_type: "TK" | "SD" | "SMP" | "SMA"
      status_akun: "nonaktif" | "aktif"
      status_bayar: "pending" | "lunas" | "gagal"
      status_dokumen: "belum" | "menunggu" | "disetujui" | "ditolak"
      status_kelulusan: "belum" | "lulus" | "tidak_lulus"
      status_pendaftaran: "dibuka" | "ditutup"
      status_tagihan: "belum_bayar" | "menunggu_verifikasi" | "lunas"
      status_verifikasi: "belum" | "diverifikasi" | "ditolak"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "siswa"],
      jenis_kelamin: ["L", "P"],
      jenis_tagihan: ["pendaftaran", "daftar_ulang"],
      jenjang_type: ["TK", "SD", "SMP", "SMA"],
      status_akun: ["nonaktif", "aktif"],
      status_bayar: ["pending", "lunas", "gagal"],
      status_dokumen: ["belum", "menunggu", "disetujui", "ditolak"],
      status_kelulusan: ["belum", "lulus", "tidak_lulus"],
      status_pendaftaran: ["dibuka", "ditutup"],
      status_tagihan: ["belum_bayar", "menunggu_verifikasi", "lunas"],
      status_verifikasi: ["belum", "diverifikasi", "ditolak"],
    },
  },
} as const
