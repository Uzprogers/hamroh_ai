import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { UserOrmEntity } from "../../infrastructure/typeorm/user.orm-entity";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { UpdateLocaleDto } from "../dto/update-locale.dto";
import { Locale } from "../../../../core/i18n/locale.enum";
import { InstitutionType, Role } from "../../config/identity.enums";

export interface PublicUser {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: Role;
  institution_type: InstitutionType;
  institution_name: string;
  grade_level: string | null;
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
        role: dto.role,
        institution_type: dto.institution_type,
        institution_name: dto.institution_name,
        grade_level: dto.grade_level ?? null,
        locale: dto.locale ?? Locale.UZ,
      }),
    );

    return { token: this.sign(created), user: this.toPublic(created) };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepo
      .createQueryBuilder("u")
      .addSelect("u.password_hash")
      .where("u.phone = :phone", { phone: dto.phone })
      .getOne();

    if (!user) throw new UnauthorizedException("INVALID_CREDENTIALS");

    const matches = await bcrypt.compare(dto.password, user.password_hash);
    if (!matches) throw new UnauthorizedException("INVALID_CREDENTIALS");

    return { token: this.sign(user), user: this.toPublic(user) };
  }

  async me(id: string): Promise<PublicUser> {
    return this.toPublic(await this.findOrFail(id));
  }

  async updateLocale(id: string, dto: UpdateLocaleDto): Promise<PublicUser> {
    const user = await this.findOrFail(id);
    user.locale = dto.locale;
    return this.toPublic(await this.userRepo.save(user));
  }

  async findOrFail(id: string): Promise<UserOrmEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException("USER_NOT_FOUND");
    return user;
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
      role: u.role,
      institution_type: u.institution_type,
      institution_name: u.institution_name,
      grade_level: u.grade_level,
      locale: u.locale,
    };
  }
}
