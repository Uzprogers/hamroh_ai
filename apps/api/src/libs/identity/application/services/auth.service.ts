import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { UserOrmEntity } from "../../infrastructure/typeorm/user.orm-entity";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { UpdateLocaleDto } from "../dto/update-locale.dto";
import { CompleteProfileDto } from "../dto/complete-profile.dto";
import { Locale } from "../../../../core/i18n/locale.enum";
import { AuthProvider, InstitutionType, Role } from "../../config/identity.enums";

export interface PublicUser {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_provider: AuthProvider;
  role: Role | null;
  institution_type: InstitutionType | null;
  institution_name: string | null;
  grade_level: string | null;
  subject: string | null;
  profile_completed: boolean;
  locale: Locale;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserOrmEntity) private readonly userRepo: Repository<UserOrmEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException("PHONE_TAKEN");

    const created = await this.userRepo.save(
      this.userRepo.create({
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
        password_hash: await bcrypt.hash(dto.password, 10),
        auth_provider: AuthProvider.LOCAL,
        role: dto.role,
        institution_type: dto.institution_type,
        institution_name: dto.institution_name,
        grade_level: dto.grade_level ?? null,
        profile_completed: true,
        locale: dto.locale ?? Locale.UZ,
      }),
    );

    return this.issue(created);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepo
      .createQueryBuilder("u")
      .addSelect("u.password_hash")
      .where("u.phone = :phone", { phone: dto.phone })
      .getOne();

    if (!user?.password_hash) throw new UnauthorizedException("INVALID_CREDENTIALS");

    const matches = await bcrypt.compare(dto.password, user.password_hash);
    if (!matches) throw new UnauthorizedException("INVALID_CREDENTIALS");

    return this.issue(user);
  }

  async me(id: string): Promise<PublicUser> {
    return this.toPublic(await this.findOrFail(id));
  }

  async updateLocale(id: string, dto: UpdateLocaleDto): Promise<PublicUser> {
    const user = await this.findOrFail(id);
    user.locale = dto.locale;
    return this.toPublic(await this.userRepo.save(user));
  }

  async completeProfile(id: string, dto: CompleteProfileDto): Promise<AuthResult> {
    const user = await this.findOrFail(id);

    if (dto.phone && dto.phone !== user.phone) {
      const taken = await this.userRepo.findOne({ where: { phone: dto.phone } });
      if (taken) throw new ConflictException("PHONE_TAKEN");
      user.phone = dto.phone;
    }

    user.first_name = dto.first_name;
    user.last_name = dto.last_name ?? user.last_name;
    user.role = dto.role;
    user.institution_type = dto.institution_type;
    user.institution_name = dto.institution_name;
    user.grade_level = dto.role === Role.STUDENT ? (dto.grade_level ?? null) : null;
    user.subject = dto.role === Role.TEACHER ? (dto.subject ?? null) : null;
    user.locale = dto.locale ?? user.locale;
    user.profile_completed = true;

    return this.issue(await this.userRepo.save(user));
  }

  async findOrFail(id: string): Promise<UserOrmEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException("USER_NOT_FOUND");
    return user;
  }

  issue(user: UserOrmEntity): AuthResult {
    return { token: this.sign(user), user: this.toPublic(user) };
  }

  private sign(user: UserOrmEntity): string {
    return this.jwtService.sign({ sub: user.id, role: user.role });
  }

  private toPublic(u: UserOrmEntity): PublicUser {
    return {
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone,
      email: u.email,
      avatar_url: u.avatar_url,
      auth_provider: u.auth_provider,
      role: u.role,
      institution_type: u.institution_type,
      institution_name: u.institution_name,
      grade_level: u.grade_level,
      subject: u.subject,
      profile_completed: u.profile_completed,
      locale: u.locale,
    };
  }
}
